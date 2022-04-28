class Notifiyer{
    //the device id to notify - @String
    to_notify;
    //category name (goes in notification) - @String
    category;
    //#unique id for the controller - @Integer
    controller_id;
    //#name of the controller that its notifiying - @String
    controller_identity;

    constructor(controller_id,category){
        
    }
    getToNotify(controller_id){
        //gets to_notify from db from local machine
    }
    getElementsToNotify(){
        //gets array of Products from DB
    }
    sendNotification(){
        //sends notification based on local data #category , #controller_identity , #to_notify , #controller_id
        
    }
}
export default Notifiyer;