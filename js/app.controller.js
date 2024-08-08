import { storageService } from "./services/async-storage.service.js"
import { placeService } from "./services/place.service.js"

window.app={
    onInit,
    initMap,
    renderPlaces,
    onRemovePlace,
    onAddPlace,
    onUpdatePlace,
    onSavePlace,
    onCloseModal,
    onReadPlace,
    onClosePlace,
    onSetFilterBy,
    onSetSortBy,
    flashMsg,
    onPanTo,
    onGetUserPos,
    onPanToPlace,
    renderMarkers,
    initRenderMarkers
}

window.onload = onInit
window.onPanTo = onPanTo
window.onGetUserPos = onGetUserPos

// a global variable saving our map for further use.
var gMap
var gMarkers

var gPlaceToEdit = null

const gQueryOptions = {
    filterBy: {txt : '', name: ''},
    sortBy: {}
}
async function onInit() {
    try {
        await initMap()
        console.log('Map is ready')
        renderPlaces()
        console.log('places list is ready')
        initRenderMarkers()
        console.log('renderMarkers done')
    } catch (err) {
        console.log('Error: cannot init map')
    }
}

function initMap(lat = 29.550360, lng = 34.952278) {
    console.log('InitMap')
    return _connectGoogleApi()
        .then(() => {
            console.log('google-map available')
            gMap = new google.maps.Map(
                document.querySelector('.map'), {
                center: { lat, lng },
                zoom: 15
            })
            gMap.addListener('click',async ev => { 
                const name = prompt('Place name?', 'Place 1') 
                const lat = ev.latLng.lat() 
                const lng = ev.latLng.lng() 
                await placeService.addPlace(name, lat, lng, gMap.getZoom()) 
                renderPlaces() 
                renderMarkers()
            })
            console.log('Map!', gMap)
        })
}

function renderPlaces() {
    var places = placeService.getPlaces(gQueryOptions)
        .then(places =>{
            console.log('places:', places)
            var strHtmls = places.map(
                place => `                  
                    <div class="button-container1"  style=" font-family: 'Poppins'; color: #fff !important;text-transform: uppercase;font-weight: 700;text-decoration: none;background: #60a3bc;padding-bottom: 20px;border-radius: 50px;display: inline-block;border: dashed;transition: all 0.4s ease 0s;">
                        <center><h2 style="color: black"> ${place.name}</h2></center>     
                        <center><button onclick="app.onReadPlace('${place.Id}')" style="background-color: green;color: white;">Details</button>
                        <button onclick="app.onUpdatePlace('${place.Id}')" style="background-color: darkgoldenrod;color: white;">Update</button></center>
                    </div><br/>   
                    <div class="button-container2" >
                        <center><button onclick="app.onPanToPlace('${place.Id}')"  style="background-color: blue; border: none; border-radius: 5px; font-weight: bold; font-size: 12px; font-family: &quot;Courier New&quot;, Courier, monospace; color: white; padding: 5px;  text-align: center; cursor: pointer;" >Go To: ${place.name}</button>
                        <button title="Delete Place" class="btn-remove" onclick="app.onRemovePlace('${place.Id}')" style="background-color: purple; border: none; border-radius: 5px; font-weight: bold; font-size: 12px; font-family: &quot;Courier New&quot;, Courier, monospace; color: white; padding: 5px;  text-align: center; cursor: pointer;" onmousedown="this.style.color='rgba(255, 255, 255, 0.4)';" onmouseover="this.style.backgroundColor= 'red'" onmouseleave="this.style.backgroundColor = 'purple'">Delete Place</button></center>
                    </div>
                    <br/><br/>
                </ul>`     
            )
            strHtmls = `
                <div class ="map continer2" style="margin-block-start: 20px;">
                <center><img src="https://cdn-icons-png.flaticon.com/512/4312/4312243.png" heigth="3px" width="20px"></center>
                <center><button onclick="app.onGetUserPos()" class="btn-user-pos"  style=" font-family: 'Poppins'; color: black ">  Get Location</button></center>
                
                <p id="myLoc" style="text-align: center;">You are at: <span class="user-pos" ></span></p><br/> 
                ` + strHtmls + `</div>`

            document.querySelector('.places-container').innerHTML = strHtmls
        })
        .catch(error =>{
            console.log('error in rendering places function:', error)
            alert('error in rendering places function')
        })
    
}

// CRUD

function onRemovePlace(placeId){
    placeService.removePlace(placeId)
        .then(()=>{
            renderPlaces()
            renderMarkers()
            flashMsg('Place Deleted')
        })
        .catch(error =>{
            console.log('error in removing place:' + placeId + 'error: ', error)
        })
}
    

function onAddPlace(){
	const elModal = document.querySelector('.update')
	elModal.showModal()
}

function onUpdatePlace(placeId) {
	const elModal = document.querySelector('.update')

	const elName = document.querySelector('.name-input')
    const elLat = document.querySelector('.lat-input')
    const elLng = document.querySelector('.lng-input')

    placeService.getPlaceById(placeId)
        .then(place =>{
            gPlaceToEdit = place

            elName.value = gPlaceToEdit.name
            elLat.value = gPlaceToEdit.lat
            elLng.value = gPlaceToEdit.lng
            elModal.showModal()
        })
        .catch(error =>{
            console.log('error in onUpdatePlace function:', error)
            alert( 'error updating place')
        })
        
    
        
}

function onSavePlace() {
	const elForm = document.querySelector('.place-name form')

	const name = document.querySelector('.name-input').value
    const lat = Number(document.querySelector('.lat-input').value)
    const lng = Number(document.querySelector('.lng-input').value)

	if (gPlaceToEdit) {
		var prmSavedPlace = placeService.updatePlace(gPlaceToEdit.Id, name, lat, lng, 15)
		gPlaceToEdit = null
	} else {
		var prmSavedPlace = placeService.addPlace( name, lat, lng, 15)
	}

    prmSavedPlace.then(savedPlace =>{
        renderPlaces()
        renderMarkers()
        flashMsg(`Place Saved (id: ${savedPlace.Id})`)
    
    })
   
}

// Place Edit Dialog

function onCloseModal() {
	document.querySelector('.modal').close()
}

// Details Name

function onReadPlace(placeId) {
	placeService.getPlaceById(placeId)
        .then(place => {
            const elName = document.querySelector('.modal')
            elName.querySelector('h3').innerText = place.name  
           // elName.querySelector('h5').innerText = place.lat   
            //elName.querySelector('h5').innerText = place.lng     
            elName.showModal()    
        })
        .catch(error =>{
            console.log('error in onReadPlace function:', error)
            alert('error finding place')
        })

       
}

function onClosePlace() {
	document.querySelector('.update').close()
}


// Filter & Sort

function onSetFilterBy() {
	const elName = document.querySelector('.filter-by .name-list')

	gQueryOptions.filterBy.txt = elName.value

	setQueryParams()
	renderPlaces()
    renderMarkers()
}

function onSetSortBy() {
	const elSortBy = document.querySelector('.sort-by select')
	const elDir = document.querySelector('.sort-by input')


    console.log('deleted this function:')
	setQueryParams()
	renderPlaces()
    renderMarkers()
}

// Query Params

function readQueryParams() {
	const queryParams = new URLSearchParams(window.location.search)

	gQueryOptions.filterBy = {
		txt: queryParams.get('name') || ''
	}

	if (queryParams.get('sortBy')) {
		const prop = queryParams.get('sortBy')
		const dir = queryParams.get('sortDir')
		gQueryOptions.sortBy[prop] = dir
	}
	renderQueryParams()
}

function renderQueryParams() {
	document.querySelector('.filter-by select').value = gQueryOptions.filterBy.txt
	document.querySelector('.filter-by input').value = gQueryOptions.filterBy.minSpeed

	const sortKeys = Object.keys(gQueryOptions.sortBy)
	const sortBy = sortKeys[0]
	const dir = gQueryOptions.sortBy[sortKeys[0]]

	document.querySelector('.sort-by select').value = sortBy || ''
	document.querySelector('.sort-by input').checked = dir === -1 ? true : false
}

function setQueryParams() {
	const queryParams = new URLSearchParams()

	queryParams.set('name', gQueryOptions.filterBy.txt)

	const sortKeys = Object.keys(gQueryOptions.sortBy)
	if (sortKeys.length) {
		queryParams.set('sortBy', sortKeys[0])
		queryParams.set('sortDir', gQueryOptions.sortBy[sortKeys[0]])
	}

	const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + queryParams.toString()

	window.history.pushState({ path: newUrl }, '', newUrl)
}

// UI

function flashMsg(msg) {
	const el = document.querySelector('.user-msg')

	el.innerText = msg
	el.classList.add('open')
	setTimeout(() => el.classList.remove('open'), 3000)
}

//MAP

function onPanTo(lat, lng) {
    const laLatLng = new google.maps.LatLng(lat, lng)
    gMap.panTo(laLatLng)
}

// This function provides a Promise API to the callback-based-api of getCurrentPosition
function getPosition() {
    console.log('Getting Pos')
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}

async function onGetUserPos() {
    try {
        const pos = await getPosition()
        console.log('User position is:', pos.coords)
        document.querySelector('.user-pos').innerText = `Latitude: ${pos.coords.latitude} - Longitude: ${pos.coords.longitude}`
        onPanTo(pos.coords.latitude, pos.coords.longitude)
        document.getElementById('myLoc').style.display = "block"

    } catch (err) {
        console.log('err!!!', err)
    }
}

function _connectGoogleApi() {
    if (window.google) return Promise.resolve()
        // TODO: Enter your API Key
    const API_KEY = 'AIzaSyCaQVlcIeYewnFSmm3xkL2d3HHy9xhYbz4'


    const elGoogleApi = document.createElement('script')
    elGoogleApi.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`
    elGoogleApi.async = true
    document.body.append(elGoogleApi)

    return new Promise((resolve, reject) => {
        elGoogleApi.onload = resolve
        elGoogleApi.onerror = () => reject('GoogleMaps script failed to load')
    })
}

async function onPanToPlace(placeId) { 
    const place = await placeService.getPlaceById(placeId) 
    gMap.setCenter({ lat: place.lat, lng: place.lng}) 
    gMap.setZoom(place.zoom) 
}

async function renderMarkers() { 
    const places = await placeService.getPlaces() 
    // remove previous markers 
    gMarkers.forEach(marker => marker.setMap(null)) 
    // every place is creating a marker 
    gMarkers = places.map(place => { 
        return new google.maps.Marker({ position: place, map: gMap, title: place.name }) 
    }) 
}

async function initRenderMarkers() { 
    const places = await placeService.getPlaces() 
    // every place is creating a marker 
    gMarkers = places.map(place => { 
        return new google.maps.Marker({ position: place, map: gMap, title: place.name }) 
    }) 
}
