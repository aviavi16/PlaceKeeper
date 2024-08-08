"use strict";

import { storageService } from "./async-storage.service.js";
import { loadFromStorage, makeId, makeLorem, saveToStorage } from "./util.service.js";

export const placeService = {
    getPlaces,
    getPlaceById,
    removePlace,
    addPlace,
    updatePlace
}


const STORAGE_KEY = 'place'
const gNames = ['home', 'resturant', 'work', 'friends'] 

_createPlaces()

function getPlaces(options = {}){
    return storageService.query(STORAGE_KEY)
        .then(places =>{
            console.log('places:', places)
            if(options?.filterBy?.txt){
                places = places.filter(place => 
                    place.name.toLowerCase().includes (options.filterBy.txt))
            }
        
            if(options?.sortBy?.name){
                places.sort((place1, place2) => place1.name.localCompare(place2.name) * options.sort)
            }
        
            return places
        })
        .catch(error =>{
            console.log('error in get places function:', error)
            alert('error in get places function')
        })
}

function getPlaceById(placeId){
    return storageService.get(STORAGE_KEY, placeId)
}

function removePlace(placeId){
    return storageService.remove(STORAGE_KEY, placeId)      
}

function addPlace(name, lat, lng, zoom){
    
    var place = _createPlace(name, lat, lng, zoom)
    return storageService.post(STORAGE_KEY, place)   
}

function updatePlace(placeId, name, lat, lng, zoom){
    var placeToUpdate = {
        Id: placeId, 
        name, 
        lat, 
        lng, 
        zoom
    }
    return storageService.put(STORAGE_KEY, placeToUpdate)  
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
    const places = loadFromStorage(STORAGE_KEY)
    if(places && places.length) return

    places =[]
    places.push(_createPlace("My house", 32.1516, 34.831213, 15))
    places.push(_createPlace("My Work", 32.1416, 34.931713, 15))
    places.push(_createPlace("best resturant", 34.1416, 32.831213, 15))
    places.push(_createPlace("shortie", 34.1466, 34.853213, 15))

    saveToStorage(STORAGE_KEY, places)   
}



