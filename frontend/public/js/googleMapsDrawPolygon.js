function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 52.520007, lng: 13.404954},
        zoom: 11
    });

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon']
        },
        circleOptions: {
            fillColor: '#ffff00',
            fillOpacity: 1,
            strokeWeight: 5,
            clickable: false,
            editable: true,
            zIndex: 1
        }
    });
    drawingManager.setMap(map);


    var marker = new google.maps.Marker({
        position: map.getCenter(),
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7
        },
        draggable: true,
        map: map
    });

    marker.addListener('dragend', showNewRect);

    /** @this {google.maps.Rectangle} */
    function showNewRect(event) {
        //console.log("Car at: ",event.latLng.lat(), " ",event.latLng.lng());
        // Because this wordcloud generating script is executed in the client, this script has no
        // access to the React router. That is why a hidden input field is incorporated in the HTML.
        // This method changes the value of the input field and triggers a click event. The input
        // field is generated by React and has an onClick listener on it. So when the onClick is
        // triggered React does the routing.
        // Note:I tried with onChange(React) event, but for some reason couldn't fire it with javascript
        let val = (event.latLng.lat()).toString() + " " + (event.latLng.lng()).toString();

        $("#hidden-search-field-pos").val(val.toLocaleLowerCase());
        var event = document.createEvent("HTMLEvents");
        event.initEvent("click", true, false);
        var target = $('#hidden-search-field-pos')[0];
        target.dispatchEvent(event);
    }

    google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
        drawingManager.setOptions({
            drawingMode: null,
            drawingControl: false
        });
        var coordinates = (polygon.getPath().getArray());
        for (let i of coordinates) {
            // Because this wordcloud generating script is executed in the client, this script has no
            // access to the React router. That is why a hidden input field is incorporated in the HTML.
            // This method changes the value of the input field and triggers a click event. The input
            // field is generated by React and has an onClick listener on it. So when the onClick is
            // triggered React does the routing.
            // Note:I tried with onChange(React) event, but for some reason couldn't fire it with javascript
            let val = (i.lat()).toString() + " " + (i.lng()).toString();

            $("#hidden-search-field-geo").val(val.toLocaleLowerCase());
            var event = document.createEvent("HTMLEvents");
            event.initEvent("click", true, false);
            var target = $('#hidden-search-field-geo')[0];
            target.dispatchEvent(event);
            console.log(i.lat(), ' ', i.lng());
        }

        // Dispatch "End of polygon points array" event
        $("#hidden-search-field-geo").val("endOfArray");
        var event = document.createEvent("HTMLEvents");
        event.initEvent("click", true, false);
        var target = $('#hidden-search-field-geo')[0];
        target.dispatchEvent(event);
    });
}