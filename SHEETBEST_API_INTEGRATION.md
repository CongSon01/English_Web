# SheetBest API Integration

## Overview
This document describes the integration of SheetBest API to replace CSV file operations in the English Learning App.

## API Configuration
- **Endpoint**: `https://api.sheetbest.com/sheets/4e6412d1-956d-4f38-844a-7451bb94faa2`
- **Method**: GET (fetch data), POST (upload data), DELETE (clear data)

## Changes Made

### 1. Configuration Updates
- Replaced `CSV_URL` constant with `SHEETBEST_API_URL`
- Updated all references from CSV file to SheetBest API

### 2. Data Fetching (`fetchVocabularyData`)
- **Before**: Fetched CSV file using `fetch(CSV_URL)` and parsed with `parseCSV()`
- **After**: Fetches JSON data directly from SheetBest API
- **Fallback**: Still uses localStorage cache and fallback data
- **Timeout**: Increased to 10 seconds for API calls

### 3. Data Synchronization (`syncToSheetBestAPI`)
- **Before**: `syncToGoogleSheets()` was disabled for CSV mode
- **After**: New `syncToSheetBestAPI()` function actively syncs data
- **Method**: Replaces entire dataset in API for consistency
- **Backup**: Always saves to localStorage as backup

### 4. CSV Management Functions

#### Save Changes (`saveCSVChanges`)
- **Before**: Generated and downloaded CSV file
- **After**: Uploads data to SheetBest API with loading indicators
- **Process**: DELETE existing data → POST new data
- **UI**: Added spinner and better error handling

#### Add/Edit/Delete Operations
- **New Functions**: `addWordToAPI()`, `updateWordInAPI()`, `deleteWordFromAPI()`
- **Strategy**: For individual operations, we update entire dataset for simplicity
- **Error Handling**: Graceful fallback to local storage

#### Refresh Data (`refreshCSVData`)
- **Before**: Restored from local `vocabularyData`
- **After**: Fetches fresh data from SheetBest API
- **UI**: Added loading spinner and error handling

#### File Upload (`confirmCSVUpload`)
- **Before**: Only updated local data
- **After**: Uploads parsed CSV data directly to SheetBest API
- **Process**: Parse CSV → Upload to API → Update local data

### 5. UI Updates
- **Modal Title**: "CSV Data Manager" → "Vocabulary Data Manager"
- **Button Labels**: 
  - "Save Changes" → "Save to API"
  - "Refresh" → "Refresh from API"
  - "Upload & Replace Data" → "Upload & Sync to API"
- **Loading Indicators**: Added spinners for all API operations

## Data Flow

### Loading Application
1. Check localStorage cache
2. If no cache, fetch from SheetBest API
3. Process and format data
4. Save to localStorage as backup
5. Filter for today's vocabulary

### Learning Session
1. User answers questions
2. Update local data immediately
3. Save to localStorage
4. Async sync to SheetBest API
5. Handle API errors gracefully

### Data Management
1. Open CSV Manager Modal
2. Clone data for editing
3. Perform CRUD operations locally
4. Save all changes to API at once
5. Update main application data

## Error Handling
- **API Failures**: Always fall back to localStorage
- **Network Issues**: Graceful degradation with user notifications
- **Loading States**: Visual feedback during API operations
- **Validation**: Proper data validation before API calls

## Benefits
- **Real-time Sync**: Data is automatically synchronized across devices
- **Reliability**: Multiple fallback layers (API → localStorage → hardcoded data)
- **Performance**: Caching reduces API calls
- **User Experience**: Clear loading states and error messages
- **Scalability**: Can handle larger datasets than CSV files

## API Limitations
- **SheetBest Free Tier**: Limited requests per month
- **Batch Operations**: We update entire dataset for simplicity
- **Rate Limiting**: May need to implement request throttling for heavy usage

## Future Improvements
- Implement incremental updates for better performance
- Add retry mechanisms for failed API calls
- Implement proper rate limiting and request queuing
- Add data validation and schema enforcement
- Consider implementing real-time updates with WebSockets

## Testing
The application can be tested by:
1. Opening `index.html` in a browser
2. Verifying data loads from SheetBest API
3. Testing CRUD operations in the Data Manager
4. Uploading CSV files to verify API integration
5. Checking fallback behavior when API is unavailable
