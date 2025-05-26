"use client";
import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

function Map() {
    const containerStyle = {
        width: '400px',
        height: '400px',
    };

    const center = {
        lat: 50.911597826074235,
        lng: -114.11570013067202,
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyBxQQwOO9H6oaSFzRmwPdhcuvJgpU_aEsY',
    });

    const [map, setMap] = React.useState(null);

    const onLoad = React.useCallback(function callback(map) {
        const bounds = new window.google.maps.LatLngBounds(center);
        map.fitBounds(bounds);
        setMap(map);
    }, [center]);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            {/* Child components, such as markers, info windows, etc. */}
            <></>
        </GoogleMap>
    ) : (
        <></>
    );
}

export default Map;


//google api 
//Go to the Google Maps Platform > Credentials page.
//On the Credentials page, click Create credentials > API key.
//The API key created dialog displays your newly created API key.

//AIzaSyBxQQwOO9H6oaSFzRmwPdhcuvJgpU_aEsY




////this is daycare location
////50.911597826074235, -114.11570013067202


//50.91157758303114, -114.11560878161687