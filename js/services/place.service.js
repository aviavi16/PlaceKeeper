var gPlaces

const STORAGE_KEY = 'place'
const gNames = ['home', 'resturant', 'work', 'friends'] 

_createPlaces()

function getPlaces(options = {}){

    var places = gPlaces.slice()
    console.log('places:', places)
    if(options?.filterBy?.txt){
        places = places.filter(place => 
            place.name.toLowerCase().includes (options.filterBy.txt))
    }

    if(options?.sortBy?.name){
        places.sort((place1, place2) => place1.name.localCompare(place2.name) * options.sort)
    }

    return places
}

function getPlaceById(placeId){
    console.log('placeId:', placeId)
    console.log('gPlaces:', gPlaces)
    return gPlaces.find(place => place.Id === placeId)
}

function removePlace(placeId){
    const placeIdx = gPlaces.findIndex(place => place.Id === placeId)
    gPlaces.splice(placeIdx, 1)

    _savePlacesToStorage()
}

function addPlace(name, lat, lng, zoom){
    var place = _createPlace(name, lat, lng, zoom)
    gPlaces.unshift(place) 

    _savePlacesToStorage()
    return place
}

function updatePlace(placeId, name, lat, lng, zoom){
    var place = gPlaces.find(place => place.Id === placeId)

    place.lat = lat
    place.lng = lng
    place.name = name
    place.zoom = zoom
    
    _savePlacesToStorage()
    return place
}

function _createPlace(name, lat, lng, zoom) {
    return {
        Id: makeId(),
        name,
        lat,
        lng,
        zoom,
        desc: makeLorem()
    }
}

function _createPlaces(){
    gPlaces = loadFromStorage(STORAGE_KEY)
    if(gPlaces && gPlaces.length) return

    gPlaces =[]
    gPlaces.push(_createPlace("My house", 32.1516, 34.831213, 15))
    gPlaces.push(_createPlace("My Work", 32.1416, 34.931713, 15))
    gPlaces.push(_createPlace("best resturant", 34.1416, 32.831213, 15))
    gPlaces.push(_createPlace("shortie", 34.1466, 34.853213, 15))

    _savePlacesToStorage()
}

function _savePlacesToStorage(){
    saveToStorage(STORAGE_KEY, gPlaces)
}


