import mongoose from "mongoose";

export const DBConnection = () =>{
    mongoose.connect("mongodb+srv://bharatshaligram:UTJc7454EedmuHib@healthcare.obdvvab.mongodb.net/school?retryWrites=true&w=majority&appName=healthCare").then(() =>{
        console.log("Database Connection Success ");
    }).catch((error) => {
        console.log(error, "Some Error has Occurred");
        
    })
}