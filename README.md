# iot-front
Front end of the Internet of Trash project.
Internet of Trash was a project conceived for the Minor course Innovation and Research at Fontys Venlo. It offers a proof of concept solution for smart waste containers in the city, allowing ultrasound sensors to measure how full the containers are and sending that information to a server via a LoRaWAN network. Garbage collection companies could then be alerted when a container is full or nearly full and calculate optimal collection routes on the website. Citizens could also use the website to view how full their local container is. 

This project contains the website that displays the local and worldwide containers. Written in plain HTML, CSS with Bootstrap and some NodeJS.

## Setup
For windows users: install NodeJS and NPM first.

Download the project.

Open the terminal in the project folder or `cd` to the project folder.

Run `npm install` in the terminal.

Configure a `src/settings/settings.json` file containing the API_URL.

Run `npm run browserify` in the terminal.

Open `index.html` in a browser.
