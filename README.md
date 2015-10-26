webrtc-explorer Signalling Server
==============================

> The `webrtc-explorer Signaling Server` implements the spec defined for the `webrtc-explorer` browser based DHT work properly, please refer to the [webrtc-explorer docs](https://github.com/diasdavid/webrtc-explorer) for instructions. 

## Project Information - v2

The 2nd version of webrtc-explorer-signalling-server is a continuation of the work developed by the first iteration, but focused on enabling the 2nd version of [webrtc-explorer]()

## [Project Information - v1.1.1](https://github.com/diasdavid/webrtc-explorer-signalling-server/releases/tag/v1.1.1)

> [David Dias MSc in Peer-to-Peer Networks by Technical University of Lisbon](https://github.com/diasdavid/browserCloudjs#research-and-development)

[![](https://img.shields.io/badge/INESC-GSD-brightgreen.svg?style=flat-square)](http://www.gsd.inesc-id.pt/) [![](https://img.shields.io/badge/TÉCNICO-LISBOA-blue.svg?style=flat-square)](http://tecnico.ulisboa.pt/) [![](https://img.shields.io/badge/project-browserCloudjs-blue.svg?style=flat-square)](https://github.com/diasdavid/browserCloudjs)

This work was developed by David Dias with supervision by Luís Veiga, all in INESC-ID Lisboa (Distributed Systems Group), Instituto Superior Técnico, Universidade de Lisboa, with the support of Fundação para a Ciência e Tecnologia. 

More info on the team's work at: 
- http://daviddias.me
- http://www.gsd.inesc-id.pt/~lveiga

If you use this project, please acknowledge it in your work by referencing the following document:

David Dias and Luís Veiga. browserCloud.js A federated community cloud served by a P2P overlay network on top of the web platform. INESC-ID Tec. Rep. 14/2015, Apr. 2015

# Badgers

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/diasdavid/webrtc-explorer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) 
[![Dependency Status](https://david-dm.org/diasdavid/webrtc-explorer-signalling-server.svg)](https://david-dm.org/diasdavid/webrtc-explorer-signalling-server)

# Spec

## Events listented by the server

- `s-register` - register a node on the DHT, assign him uuid and inform that Node of his Id through `c-registered`

- `s-send-offer` - forward signaling data from one client that wants to connect to another client

- `s-offer-accepted` - forward response signaling data

## Events emitted by the server

- `c-finger-update` - let a client know that he should update one of his fingers
- `c-predecessor` - let a client know of his predecessorId

- `c-offer-accepted` - forward response signaling data

- `c-accept-offer` - Ask a client to accept an offer from another client 

- `c-registered` - tell a client he is registered and what is their Id

