import React, { Component } from 'react';
import { ethereumBackendUrl, s2ServerUrl } from '../config';

import { compose, withProps } from "recompose";
import {
    withScriptjs,
    withGoogleMap,
    GoogleMap,
    Marker
} from "react-google-maps";

const ReturnCarMap = compose(
    withProps({
        googleMapURL: "https://maps.googleapis.com/maps/api/js?key=AIzaSyDd3nVf8mY97Bl1zk9lx6j5kHZDosCxgVA&v=3.exp&libraries=geometry,drawing,places",
        loadingElement: <div style={{ height: `100%` }} />,
        containerElement: <div style={{ height: `400px` }} />,
        mapElement: <div style={{ height: `100%` }} />,
        center: { lat: 52.520007, lng: 13.404954 },
    }),
    withScriptjs,
    withGoogleMap
)(props =>
    <GoogleMap
        defaultZoom={11}
        defaultCenter={props.center}
    >
        {props.renderCars(props.rentedCars)}
    </GoogleMap>
);




class RentedCars extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rentedCars: [],
            selectedCar: {},
            markerVisibility: [],
            visible: true
        };
        this.setOwnerEthAccount = this.setOwnerEthAccount.bind(this);
        this.returnCar = this.returnCar.bind(this);
        this.fetchRentedCars = this.fetchRentedCars.bind(this);
        this.flattenRentedCarsList = this.flattenRentedCarsList.bind(this);

        this.renderCar = this.renderCar.bind(this);
        this.renderCarOnMap = this.renderCarOnMap.bind(this);
        this.handleClickOnCar = this.handleClickOnCar.bind(this);
        this.returnCarAndRerender = this.returnCarAndRerender.bind(this);
        this.setStateOfRentedCars = this.setStateOfRentedCars.bind(this);
        this.sortCarsById = this.sortCarsById.bind(this);
    }

    componentDidMount() {
        this.fetchRentedCars();
    }

    fetchRentedCars() {
        let url = ethereumBackendUrl + '/renter/' + this.props.renterEthAddress + '/getRentedCars';
        fetch(url, {
            method: 'get'
        })  .then(result=>result.json())
            .then(result=>result.success ? this.flattenRentedCarsList(result.data) : null);
    }

    sortCarsById(carList) {
        let tempCars = Array.apply(null, Array(carList.length)).fill({});

        for (let i = 0; i < carList.length; i++) {
            tempCars[carList[i].id] = carList[i];
        }
        return tempCars;
    }

    setStateOfRentedCars(flattenedDict, totalNumber) {

        if (flattenedDict.length === totalNumber) {

            let tempMarkerVisib = Array.apply(null, Array(flattenedDict.length)).fill(true);
            flattenedDict = this.sortCarsById(flattenedDict);

            // Set Selected Car
            let selectedCar = flattenedDict[0];

            this.setState({
                selectedCar: selectedCar,
                rentedCars: flattenedDict,
                markerVisibility: tempMarkerVisib
            });
        }
    }

    flattenRentedCarsList(rentedCars) {
        var flattenedDict = [];
        var idCounter = 0;
        var totalNumber = 0;

        function handleResponse(newCar, result) {

            newCar['carDetails']['position'] = result;
            flattenedDict.push(newCar);

            console.log(flattenedDict);
            return flattenedDict;
        }

        // Get complete car number. Can be implemeneted better!
        for (let carsOfOneOwner of rentedCars) {
            for (let car of carsOfOneOwner.availableCarContract) {
                totalNumber++;
            }
        }

        for (let carsOfOneOwner of rentedCars) {
            for (let car of carsOfOneOwner.availableCarContract) {
                car['owner'] = carsOfOneOwner.ownerContract;
                car['id'] = idCounter;


                // Convert position from s2 to lat lon
                let url = s2ServerUrl + '/convertS2ToBoundingLatLonPolygon?cellId=' + car['carDetails']['position'];

                fetch(url, {mode: 'cors'})
                    .then(result=>result.json())
                    .then(result=>handleResponse(car, result))
                    .then(result=>this.setStateOfRentedCars(flattenedDict, totalNumber));

                if (car.id == 0) {
                    this.setState({selectedCar: car});
                }
                idCounter++;
            }
        }
        return flattenedDict;
    }

    handleClickOnCar(carId) {
        this.setState({selectedCar: this.state.rentedCars[carId]});
        console.log("clicker", carId);
    }

    renderCarOnMap(car) {
        return (
            <div>
                {car.map(this.renderCar)}
            </div>
        );
    }

    renderCar (car) {
        return (
            <div key={Math.floor(Math.random() * 9999999)}>
                {this.state.markerVisibility[car.id]
                    ? <Marker
                        position={car.carDetails.position[0]} draggable={false}
                        onClick={() => this.handleClickOnCar(car.id)}/>
                    : null}
            </div>
        );
    }

    returnCar() {
        console.log(this.props.renterEthAddress, this.state.selectedCar.owner, this.state.selectedCar.carContractAddress);
        let url = ethereumBackendUrl + '/renter/' + this.props.renterEthAddress + '/'
            + this.state.selectedCar.owner + '/' + this.state.selectedCar.carContractAddress + '/returnCar';
        fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        })
            .then(result=>result.json())
            .then(result=>this.returnCarAndRerender(result))
            .then(res=>this.props.getBalance());
    }

    returnCarAndRerender(result) {
        if (result.success == true) {
            let tempVis = this.state.markerVisibility;
            tempVis[this.state.selectedCar.id] = false;

            let tempCars = this.state.rentedCars;
            tempCars[this.state.selectedCar.id] = {};

            let temp = false;
            if (this.state.visible == false) {
                temp = true;
            }

            this.setState({
                markerVisibility: tempVis,
                rentedCars: tempCars,
                visible: temp
            });
        }
    }

    setOwnerEthAccount() {
        this.setState({progressStep: 2});
    }

    render() {
        return (

            <div className="rent-car row">
                <p className="col-sm-12">
                    Click one of the cars on the map. Click the return button in the grey area. This would return your
                    penalty deposit if you haven't left the geofence defined in the contract.
                </p>
                <div className="renter-map col-lg-9 col-md-8 col-sm-12 col-xs-12">
                    <ReturnCarMap
                        visible={this.state.visible}
                        rentedCars={this.state.rentedCars}
                        renderCars={this.renderCarOnMap}
                    />
                </div>
                <div className="car-info col-lg-3 col-md-4 col-sm-12 col-xs-12">
                    <h3>Car Information:</h3>
                    <p>
                        <b>Address:</b> {this.state.selectedCar != undefined ? this.state.selectedCar.carContractAddress : null}
                        <br/>
                        <b>Deposited:</b>      {this.state.selectedCar != undefined &&
                                        this.state.selectedCar.carDetails != undefined
                                        ? this.state.selectedCar.carDetails.penaltyValue : null} Ether
                    </p>
                    <button onClick={this.returnCar}>Return</button>
                </div>

            </div>

        );
    }
}

export default (RentedCars);
