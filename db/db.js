 import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const database = async()=>{
    const url = process.env.DB_URL;
    try {
        await mongoose.connect(url);
        console.log("Connected to Database");
    } catch (error) {
        console.error("Error connecting to Database:", error);
    }
}
export default database;