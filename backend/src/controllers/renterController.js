//Import sol compiler and file system handler
const solc = require('solc');
const fs = require('fs');
const Web3 = require('web3');
var base = require('../model/callback');
const Account = require('../model/accounts').Accounts;


//Added temprory for testing else global.web3 will be used
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//car
var contracts_input = fs.readFileSync('src/smartcontracts/CarSharingContract.sol');
var contracts_output = solc.compile(contracts_input.toString(), 1);

var car_bytecode = contracts_output.contracts[':CarDetails'].bytecode;
var car_abi = JSON.parse(contracts_output.contracts[':CarDetails'].interface);
var car_contract = web3.eth.contract(car_abi);

//owner
var owner_bytecode = contracts_output.contracts[':SmartCarSharing'].bytecode;
var owner_abi = JSON.parse(contracts_output.contracts[':SmartCarSharing'].interface);
var owner_contract = web3.eth.contract(owner_abi);

//renter
var renter_bytecode = contracts_output.contracts[':SmartCarSharing'].bytecode;
var renter_abi = JSON.parse(contracts_output.contracts[':SmartCarSharing'].interface);
var renter_contract = web3.eth.contract(renter_abi);



module.exports = {

    getAllAvailableCars: function(callback){
        Account.findAll().then(result=>{
            var availableCars = new Array();
            for (var i = 0; i < result.length; i++) {
                if(result[i].car_owner_address){
                    console.log("Car owebers "+JSON.stringify(result[i]));
                        var car_owner = owner_contract.at(result[i].car_owner_address);
                        var available_car = car_owner.ListAvailableCars.call();
                        availableCars.push({ownerContract:result[i].car_owner_address,availableCarContract:available_car});
                }
            }
             base.successCallback(availableCars,callback);
        },
            error=>{
                base.errorCallback(error,callback);
        });
    },

    getOwnerContractAsRenter : function(accounts_address, callback){
            base.successCallback({Message : "Implementation is pending"},callback);
    },

	rentCar : function (account_address, ownercontractaddress ,car_contract_address, callback){
		//Implementation Pending as per ABI	
            base.successCallback({Message : "Implementation is pending"},callback);	
	},

	returnCar : function (owner_address, ownercontractaddress ,car_contract_address, callback){
		//Implementation Pending as per ABI
            base.successCallback({Message : "Implementation is pending"},callback);
	}
}