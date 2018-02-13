pragma solidity ^0.4.18;


contract CarDetails {

    address public owner;

    string public carGSMNum;
    //uint public penaltyValue = 100;
    uint public penaltyValue;

    bool availability = true;

    bool leftGeofence = false;
    //string position = "";
    //string geofence_prefix= "u33";
    //string geofence_prefix;
    //string[] geofence_suffix = ["h", "k","s","u","5","7","e","g","4","6","d","f","1","3","9","c"];
    //int128[] geofenceInt= [855152, 855154, 855160, 855162, 855141, 855143, 855149,855151, 855140, 855142, 855148, 855150, 855137, 855139, 855145, 855147];
    //int128 positionInt = 0;
    //address constant oracle = 0x8ead2d9305536ebdde184cea020063d2de3665c7;
    address oracle;

    uint pendingWithdrawals = 0;

    bytes16 position;

    bytes6 geofence_prefix;

    bytes16[] geofence_suffix;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOracle {
        require(msg.sender == oracle);
        _;
    }

    //event TraceLocation(bytes16 number);
    event CarRenterSatus(address renter, address car, bool status);

    /////////////////////////////////////
    //            Functions
    /////////////////////////////////////

    function CarDetails(string _carGSMNum, uint _penaltyValue, bytes16 _position, bytes6 _geofencePrefix, bytes16[] _geofenceSuffix, address _oracle)  {
        carGSMNum = _carGSMNum;
        owner = msg.sender;
        penaltyValue = _penaltyValue;
        position = _position;
        geofence_prefix = _geofencePrefix;
        geofence_suffix = _geofenceSuffix;
        oracle = _oracle;
    }


    //Check if "curPos" hash is within the geofence defined in the "geofence" array
    //function checkPositionInGeofenceGeohash() {
    //bytes memory bPrefixFence = bytes(geofence_prefix);
    //bytes memory bPosition = bytes(position);
    //for(uint i; i<3; i++){

    //      if(bPrefixFence[i] != bPosition[i]) leftGeofence = true;

    //}
    //  if(!leftGeofence){
    //  leftGeofence = true;
    //for(uint j; j < geofence_suffix.length; j++){
    //   bytes memory bSuffix = bytes(geofence_suffix[j]);
    //  if(bPosition[3] == bSuffix[0]) leftGeofence = false;

    /*
    bool equal = true;
    bytes memory bSuffix = bytes(geofence_suffix[j]);
    for(uint k; k < suffix_length; k++ ){
        if(bPosition[3 + k] != bSuffix[k]) equal = false;
    }
    if(equal) leftGeofence = false;
    */

    //    }

    //}

    ///for(uint i;i<3;i++){
    // if(geofence_prefix[i]!=position[i]){
    ///leftGeofence = true;
    // break;
    // }
    // }
    // if(leftGeofence==false){
    //  leftGeofence=true;
    //  for(uint j; j<geofence_suffix.length;j++){
    //  bytes4 temp = geofence_suffix[j];
    //  if(bytes1(position[3])==bytes1(temp[0]))
    // {
    //    leftGeofence = false;
    //     break;
    // }
    //  }
    //  }
    //  }
    // function checkPositionInGeofenceIntGeoHash() {

    ///The position and the geofence have to be encoded with the same amount of bits
    //If for example the position is encoded with more bits, it has to be shifted
    //to the same amount of bits that the geofence is encoded with
    //
    // bool inside = false;
    // for(uint i; i < geofenceInt.length; i++){
    //     if(positionInt == geofenceInt[i]){
    //         inside = true;
    //     }
    // }
    // leftGeofence = !inside;
    // }

    function checkPositionInGeofence(bytes16 position, bytes6 prefix, bytes16[] suffix)
    public constant returns (bool)
    {
        bool out = leftGeofence;
        leftGeofence = true;
        return true;
        //violation condition for prefix
        if (position[0] != prefix[0] || position[1] != prefix[1] || position[2] != prefix[2]) {
            out = true;
        }
        else if (out == false)
        {
            for (uint i = 0; i < suffix.length; i++) {
                bytes16 hash = suffix[i];
                for (uint j = 0; j < hash.length; j++) {
                    //if the bytes do not match
                    if (position[j + 3] != hash[j]) {
                        out = true;
                        // do not need to check for the current geofence value
                        //move to the next suffix
                        break;
                    }
                    //if they match
                    else {
                        out = false;
                        //continue; // keep checking the next character
                    }
                    //since the geofences suffix may be of variable length
                    // stop checking if two consecutive positions are 0
                    if (hash[j + 1] == 0 && hash[j + 2] == 0) {
                        break;
                        //end of string and do not check further
                    }

                }
                if (out == false) {
                    break;
                }
            }
        }
        leftGeofence = out;
        return leftGeofence;
    }

    /////////////////////////////////////
    // Functions called by car itself
    /////////////////////////////////////

    function isAvailable() public constant returns (bool) {
        return availability;
    }

    function hasLeftGeofence() constant returns (bool) {
        return leftGeofence;
    }

    function deleteCarDetails() onlyOwner {
        // return the pending money is any 

        selfdestruct(owner);
    }

    function SetCarStatus(address renter, bool status, bool leftGeo){
        //TraceLocation(_carGSMNum);
        CarRenterSatus(renter, address(this), status);
        availability = status;
        leftGeofence = leftGeo;
    }

    // function setOracleAddress(address _oracle) onlyOwner{
    //     oracle=_oracle;
    // }

    //  all address can create oracle onlyOwner removed
    //function setOracleAddress(address _oracle){
    //    oracle = _oracle;
    //}


    function GetCarDetails() onlyOwner public constant returns (uint _penaltyValue, string _carGSMNum,
    bytes16 _position, bytes6 _geofencePrefix, bytes16[] _geofenceSuffix) {
        _penaltyValue = penaltyValue;
        _carGSMNum = carGSMNum;
        _position = position;
        _geofenceSuffix = geofence_suffix;
        _geofencePrefix = geofence_prefix;
    }

    /////////////////////////////////////
    // Functions called by the oracle
    /////////////////////////////////////

    function updatePosition(bytes16 curPos) onlyOracle returns (bool) {
        position = curPos;
        // checkPositionInGeofenceGeohash();
        bool out = checkPositionInGeofence(curPos, geofence_prefix, geofence_suffix);
        return out;
    }

    function getPosition() constant returns (bytes32) {
        return position;
    }

}


contract Owner {

    /* for simplicity following assumptions have been taken:
    * 1. Renter can rent only one car
    * 2. Owner can have multiple renters.
    *
    */
    struct RenterInfo {
    //address renter;
        address rented_car;
        uint moneyForcar; //rent + deposit
    }

    mapping (address => RenterInfo) renters;

    address[] public renterAddress;
    //Renter[] renters; 


    address public owner_address;

    uint ownerEarnings;
    uint fundsLockedInContract;

    address[] cars;

    address[] listAvailableCars;
    address[] listRentedCars;

    modifier onlyOwner() {
        require(msg.sender == owner_address);
        _;
    }

    function Owner(bytes16 carGSMNum) {
        owner_address = msg.sender;
    }


    /////////////////////////////////////
    // Functions called by owner
    /////////////////////////////////////

    function addNewCar(string _carGSMNum, uint _penaltyValue, bytes16 _position, bytes6 _geofencePrefix, bytes16[] _geofenceSuffix, address oracle) onlyOwner returns (address){
        address carContract = new CarDetails(_carGSMNum, _penaltyValue, _position, _geofencePrefix, _geofenceSuffix, oracle);
        cars.push(carContract);
        listRentedCars.push(0x0);
        listAvailableCars.push(carContract);
        return carContract;
    }

    function deleteCar(address carAddress) onlyOwner {
        bool available = false;

        for (uint i = 0; i < cars.length; i++) {
            if (cars[i] == carAddress) {
                CarDetails carObj = CarDetails(cars[i]);
                available = carObj.isAvailable();
                carObj.deleteCarDetails();
                cars[i] = cars[cars.length - 1];
                delete cars[cars.length - 1];
                cars.length--;
                break;
            }
        }

        bool aDeleted = false;
        bool rDeleted = false;

        if (available) {
            for (uint j = 0; j < listAvailableCars.length; j++) {
                if (listAvailableCars[j] == carAddress) {
                    listAvailableCars[j] = listAvailableCars[listAvailableCars.length - 1];
                    delete listAvailableCars[listAvailableCars.length - 1];
                    listAvailableCars.length--;
                    aDeleted = true;
                    if (rDeleted) {
                        break;
                    }
                }

                if (listRentedCars[j] == 0x0) {
                    listRentedCars[j] = listRentedCars[listRentedCars.length - 1];
                    delete listRentedCars[listRentedCars.length - 1];
                    listRentedCars.length--;
                    rDeleted = true;
                    if (aDeleted) {
                        break;
                    }
                }
            }
        } else {
            for (uint m = 0; m < listAvailableCars.length; m++) {
                if (listAvailableCars[m] == 0x0) {
                    listAvailableCars[m] = listAvailableCars[listAvailableCars.length - 1];
                    delete listAvailableCars[listAvailableCars.length - 1];
                    listAvailableCars.length--;
                    aDeleted = true;
                    if (rDeleted) {
                        break;
                    }
                }

                if (listRentedCars[m] == carAddress) {
                    listRentedCars[m] = listRentedCars[listRentedCars.length - 1];
                    delete listRentedCars[listRentedCars.length - 1];
                    listRentedCars.length--;
                    rDeleted = true;
                    if (aDeleted) {
                        break;
                    }
                }
            }
        }
    }

    function showCars() onlyOwner constant returns (address[]) {
        return cars;
    }

    function showEarnings() onlyOwner constant returns (uint) {
        return ownerEarnings;
    }

    function showFundsLockedInContract() onlyOwner constant returns (uint) {
        return fundsLockedInContract;
    }

    function showRenters() onlyOwner constant returns (address[]) {
        return renterAddress;
    }

    function getRenterInfo(address _renterAddress) view public returns (address, uint) {
        return (renters[_renterAddress].rented_car, renters[_renterAddress].moneyForcar);
    }


    /////////////////////////////////////
    // Functions called by renter
    /////////////////////////////////////

    function getAvailableCars() constant returns (address[]) {
        return listAvailableCars;
    }

    function getRentedCars() constant returns (address[]) {
        return listRentedCars;
    }

    function alreadyRentedCarByUser(address renterAdr) constant returns (address) {
        var renter = renters[renterAdr];
        return renter.rented_car;
    }

    function insertInAvailableList(address carAdr) constant {
        bool laRdy = false;
        bool lrRdy = false;

        for (uint i = 0; i < listAvailableCars.length; i++) {
            if (!laRdy && listAvailableCars[i] == 0x0) {
                listAvailableCars[i] = carAdr;
                laRdy = true;
                if (lrRdy) {
                    break;
                }
            }

            if (!lrRdy && listRentedCars[i] == carAdr) {
                listRentedCars[i] = 0x0;
                lrRdy = true;
                if (laRdy) {
                    break;
                }
            }
        }
    }

    function insertInRentedList(address carAdr) constant {
        bool laRdy = false;
        bool lrRdy = false;

        for (uint i = 0; i < listAvailableCars.length; i++) {
            if (!laRdy && listAvailableCars[i] == carAdr) {
                listAvailableCars[i] = 0x0;
                laRdy = true;
                if (lrRdy) {
                    break;
                }
            }

            if (!lrRdy && listRentedCars[i] == 0x0) {
                listRentedCars[i] = carAdr;
                lrRdy = true;
                if (laRdy) {
                    break;
                }
            }
        }
    }

    function withdrawEarnings() public onlyOwner {
        uint amount = ownerEarnings;
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        ownerEarnings = 0;
        msg.sender.transfer(amount);
    }

    function rentCar(address carAddress) payable returns (bool){
        bool success = false;
        /*for(uint i = 0; i < cars.length; i++) {
            CarDetails carObj = CarDetails(cars[i]);
            bool isCarAvailable = carObj.isAvailable();
            if(cars[i] == carAddress && isCarAvailable){
                 renters.push(Renter(msg.sender, carAddress, msg.value));
                 carObj.SetCarStatus(msg.sender,false);
                 owner_balance += msg.value;
                 success= true;
            }
        }*/
        CarDetails carObj = CarDetails(carAddress);
        bool isCarAvailable = carObj.isAvailable();

        insertInRentedList(carAddress);

        if (isCarAvailable) {
            var renter = renters[msg.sender];
            renter.rented_car = carAddress;
            renter.moneyForcar = msg.value;
            renterAddress.push(msg.sender);
            carObj.SetCarStatus(msg.sender, false);
            fundsLockedInContract += msg.value;
            success = true;
        }

        return success;
    }

    function returnCar(address carAddress) returns (bool){
        /*  for(uint k = 0; k < cars.length; k++) {
              CarDetails carObj = CarDetails(cars[k]);
              bool leftGeofence = carObj.hasLeftGeofence();
              uint deposit = carObj.penaltyValue();
              if(cars[k] == carAddress && leftGeofence == false)
              {
                  //if the renter did not left geofence, return money
                  for(uint i=0;i< renters.length; i++){
                      renters[i].renter.send(deposit);
                      owner_balance -= deposit;
                      delete renters[i];
                  }
              }
          }*/

        bool success = false;
        /* for(uint i=0;i<renters.length; i++){
           // checks for valid renter and car address
           if(renters[i].renter == msg.sender && renters[i].rented_car==carAddress){
               CarDetails carObj = CarDetails(carAddress);
               bool leftGeofence = carObj.hasLeftGeofence();
               uint deposit = carObj.penaltyValue();
               if(leftGeofence == false){
                     renters[i].renter.send(deposit); // send returns false on failure
                     owner_balance -= deposit;
                     //delete renters[i];
               }
               delete renters[i];
               carObj.SetCarStatus(msg.sender,true);
               success= true;
           }
         }*/
        var renter = renters[msg.sender];
        if (renter.rented_car == carAddress) {
            CarDetails carObj = CarDetails(carAddress);
            bool leftGeofence = carObj.hasLeftGeofence();
            uint deposit = carObj.penaltyValue();
            fundsLockedInContract -= deposit;

            if (leftGeofence == false) {
                msg.sender.transfer(deposit);
            } else {
                ownerEarnings += deposit;
            }

            delete renters[msg.sender];
            carObj.SetCarStatus(msg.sender, true, false);
            success = true;
        }


        for (uint i = 0; i < renterAddress.length; i++) {
            if (renterAddress[i] == msg.sender) {
                delete renterAddress[i];
            }
        }

        insertInAvailableList(carAddress);

        return success;
    }
}