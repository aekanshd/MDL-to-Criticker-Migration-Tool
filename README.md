# MDL to Criticker Sync

A migration tool designed to help users seamlessly transfer their watched drama and movie lists from MyDramaList (MDL) to Criticker. The tool fetches your ratings, matches them against the TMDB/IMDb database, and generates a formatted CSV file ready for import into Criticker.

## 🚀 Features

- **Multiple Ingestion Methods**: Support for Username fetching, PDF upload, and Raw Paste.
- **Smart Title Matching**: Automatically looks up MyDramaList titles using TMDB API to find the corresponding IMDb IDs required by Criticker.
- **Score Conversion**: Automatically converts MDL's 1-10 scoring system to Criticker's 1-100 system.
- **Review Matchings Dashboard**: A comprehensive review dashboard to manually review matches, filter by status (Not Found, Needs Review, Manual Overrides, etc.), and correct/override mismatches.
- **State Backup & Restore**: Backup your entire matched state as a CSV file to resume the review process later.
- **Selective Export**: Export either all matched items or strictly the manually reviewed ones.

## ⚠️ Important Note: Recommended Ingestion Method

**The easiest and most reliable way to use this tool is the "Raw Paste" method.** 

Due to Cloudflare protection and other scraping limitations on MyDramaList's side, directly fetching via the API / Username method may fail or be inconsistent.

**How to use the Raw Paste method:**
1. Go to `https://mydramalist.com/dramalist/<username>`
2. Ensure in the filters the status is "All", and remove any other filters to get the complete list.
3. Before running the copy command, ensure all entries in the list are rendered on the page by scrolling till the end of the page.
4. Open your browser console (F12) and run the provided Bookmarklet script (available on the app's first step under the "Raw Paste" tab).
5. The data is copied to your clipboard. Paste the result into the "Raw Paste" text area.

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your app)*

### 1. Ingestion Phase

![Ingestion Phase](./docs/ingestion.png)

### 2. Matching & Processing

![Matching Phase](./docs/matching.png)

### 3. Review Matchings Dashboard

![Review Matchings Dashboard](./docs/review-matchings.png)

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, framer-motion, lucide-react
- **Backend/API**: Express (Node.js), Axios
- **External Apis**: TMDB API

## 🏃‍♂️ Running Locally

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your TMDB API Key. 
   *(You can get a TMDB API Key by registering an account at [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api))*
   ```env
   TMDB_READ_ACCESS_TOKEN=your_token_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
