# NERVIS
This repository hosts the code for NERVIS, a network graph visualization tool for Named Entities described in the following publication:
> Uroš Šmajdek and Ciril Bohak (2024), **NERVIS: An Interactive System for Graph-Based Exploration and Editing of Named Entities**
https://doi.org/10.48550/arXiv.2510.04971

## Setup
To set up build and host the client application, run:
```
cd client
npm install
npm run build
cd ..
cd server
npm install
npm start
```
The server will be hosted at `http://localhost:3000`.

## Acknowledgment
This work was supported by the Slovenian Research and Innovation Agency research programme *Digital Humanities: resources, tools and methods* (2022-2027) [grant number P6-0436] and by the project *Large Language Models for Digital Humanities* (2024-2027) [grant number GC-0002].