#!/bin/bash

echo "Running install step..."
npm ci

echo "Running build step..."
npm run build

echo "Starting the application..."
npm start