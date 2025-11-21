---
layout: home
permalink: index.html

# Please update this with your repository name and title
repository-name: e21-co227-SmartCityHeatMapGroup22
title:
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template"

# Smart City Heat Map

---

<!-- 
This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/)

![Sample Image](./images/sample.png)
 -->

## Team
- E/21/113, Dissanayake H.G.K.V.D.C., [e21113@eng.pdn.ac.lk](mailto:e21113@eng.pdn.ac.lk)
- E/21/141, Fransisco R.D.D.K., [e21141@eng.pdn.ac.lk](mailto:e21141@eng.pdn.ac.lk)
- E/21/193, Jayasinghe B.V.N., [e21193@eng.pdn.ac.lk](mailto:e21193@eng.pdn.ac.lk)
- E/21/407, Thennakoon T.M.I.I.C., [e21407@eng.pdn.ac.lk](mailto:e21407@eng.pdn.ac.lk)
  
---

## Table of Contents
1. [Introduction](#introduction)
2. [Other Sub Topics](#other-sub-topics)
3. [Links](#links)

---

## Introduction
The 75Exhibition Heatmap Dashboard is a full-stack web application designed to manage and balance crowd density within the Computer Department exhibition hall (Smart City concept). It provides a real-time visual representation of visitor distribution, updating every 10 seconds. Additionally, it serves as an information hub where users can discover specific exhibits located within each zone by simply clicking on the respective area.

---

## Solution & Impact


**Dashboard Features**

+ **Real-time Crowd Monitoring:** Visualizes live occupancy across eight exhibition zones with data refreshing every 10 seconds.
+ **Smart City Crowd Balancing:** Helps identify high-density areas to facilitate better crowd management decisions.
+ **Exhibit Discovery:** Enables users to click on zones to inspect specific exhibits, making navigation easier.
+ **Search & Recommendation:** Uses a Gemini proxy (AI) or local keywords to recommend zones based on topics.
+ **Data Storage:** Stores geospatial or point-based intensity data for analytics.
  
Impact
This centralized monitoring system simplifies event operations, supports quick decision-making during the exhibition, and enhances the visitor experience by effectively managing crowd flow.

---

## Features & Architecture

### Key Features

+ Interactive Heatmap UI: SVG-based map with clickable zones and an occupancy legend that updates every 10 seconds.
+ Zone Management: View live visitor counts (GET /api/zones) and manage exhibit details per zone.
+ Exhibit Information: On-click functionality to view, add, or delete exhibits within a specific zone (backend/zoneInfoAPI.js).
+ Search Helper: AI-powered search (Gemini) or keyword fallback to find zones relevant to specific topics.
+ Security: Basic admin password checks for critical add/remove flows.

### Architecture Overview

+ Frontend: React 19 + Vite (ES modules) for a responsive user interface.
+ Backend: Node.js + Express microservice exposing RESTful APIs.
+ Database: PostgreSQL for storing zone visitors, exhibit details, and point data.
+ Third-Party: Google Generative Language (Gemini) for optional AI-based search.

---

## How to Run
#### Clone Repository
  git clone <repository-url>
  cd <repository-folder>
#### Install Dependencies
##### a) Backend
  cd backend
  npm install
##### b) Frontend
  cd frontend
  npm install

---

## Environment Variables Create a .env file inside the backend directory:
  PORT=2000
  DATABASE_URL="Your Postgres connection string"
  LOCAL_DB_URL="Optional alternate DB URL"
  USE_POSTGIS=true
  GEMINI_API_KEY="Optional Google API Key"
 
---

## Running the System Locally
#### a) Database Setup Ensure PostgreSQL is running. Use the provided SQL to create the database and seed data:
  psql -U postgres -h localhost -W
  \i backend/sql/create_zone_info.sql
#### b) Backend The backend will run on http://localhost:2000 (default).
  cd backend
  npm run dev
#### c) Frontend The frontend will run on http://localhost:5173.
  cd frontend
  npm run dev

---

## Links

- [Project Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)


[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
