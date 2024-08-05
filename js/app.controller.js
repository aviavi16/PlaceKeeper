
"use strict";
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
                await addPlace(name, lat, lng, gMap.getZoom()) 
                renderPlaces() 
                renderMarkers()
            })
            console.log('Map!', gMap)
        })
}

function renderPlaces() {
    var places = getPlaces(gQueryOptions)
    console.log('places:', places)
    var strHtmls = places.map(
        place => `<article class="place-preview"> 
            <h2> ${place.name}</h2>
            <button title="Delete Place" class="btn-remove" onclick="onRemovePlace('${place.Id}')">Delete Place</button><br/><br/>
            
            <button onclick="onPanToPlace('${place.Id}')">Go To ${place.name}</button><br/><br/>
            <button onclick="onReadPlace('${place.Id}')">Details</button>
            <button onclick="onUpdatePlace('${place.Id}')">Update</button>


        </article>`     
    )
    document.querySelector('.places-container').innerHTML = strHtmls
    //document.querySelector('.places-container').innerHTML = "<span> test </span>".Join('')
}

// CRUD

function onRemovePlace(placeId){
    removePlace(placeId)
    renderPlaces()
    renderMarkers()
    flashMsg('Place Deleted')
}

function onAddPlace(){
    resetName()

	const elModal = document.querySelector('.place-name')
	elModal.showModal()
}

function onUpdatePlace(placeId) {
	const elModal = document.querySelector('.update')

	const elName = document.querySelector('.name-input')
    const elLat = document.querySelector('.lat-input')
    const elLng = document.querySelector('.lng-input')


	var place = getPlaceById(placeId)
        
    gPlaceToEdit = place

    elName.value = gPlaceToEdit.name
    elLat.value = gPlaceToEdit.lat
    elLng.value = gPlaceToEdit.lng
    elModal.showModal()
        
}

function onSavePlace() {
	const elForm = document.querySelector('.place-name form')

	const elName = elForm.querySelector('select')

	const name = elName.value

	if (gPlaceToEdit) {
		var prmSavedPlace = updatePlace(gPlaceToEdit.Id, name, 32.1416, 34.831213,"bla bla blka")
		gPlaceToEdit = null
	} else {
		var prmSavedPlace = addPlace(gPlaceToEdit.Id,name, 32.1416, 34.831213,"bla bla blka")
	}

    prmSavedPlace
        .then(savedPlace=> {
            elForm.reset()
        
            renderPlaces()
            renderMarkers()
            flashMsg(`Place Saved (id: ${savedPlace.Id})`)
        })
}

// Place Edit Dialog

function onCloseModal() {
	document.querySelector('.modal').close()
}

function resetName() {
	const elForm = document.querySelector('.place-name form')
	elForm.reset()
}

// Details Name

function onReadPlace(placeId) {
	var place = getPlaceById(placeId)
    const elName = document.querySelector('.modal')
    elName.querySelector('h3').innerText = place.name        
    elName.showModal()       
}

function onClosePlace() {
	document.querySelector('.modal').close()
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
    } catch (err) {
        console.log('err!!!', err)
    }
}

function _connectGoogleApi() {
    if (window.google) return Promise.resolve()
    const API_KEY = process.env.API_KEY

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
    const place = await getPlaceById(placeId) 
    gMap.setCenter({ lat: place.lat, lng: place.lng}) 
    gMap.setZoom(place.zoom) 
}

async function renderMarkers() { 
    const places = await getPlaces() 
    // remove previous markers 
    gMarkers.forEach(marker => marker.setMap(null)) 
    // every place is creating a marker 
    gMarkers = places.map(place => { 
        return new google.maps.Marker({ position: place, map: gMap, title: place.name }) 
    }) 
}

async function initRenderMarkers() { 
    const places = await getPlaces() 
    // every place is creating a marker 
    gMarkers = places.map(place => { 
        return new google.maps.Marker({ position: place, map: gMap, title: place.name }) 
    }) 
}
