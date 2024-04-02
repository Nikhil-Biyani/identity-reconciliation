# identity-reconciliation

## Complete Problem Statement
```
https://bitespeed.notion.site/Bitespeed-Backend-Task-Identity-Reconciliation-53392ab01fe149fab989422300423199
```

This service provides an API endpoint `/identify` to reconcile customer identities based on their email and phone number.

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- Node.js
- npm (Node Package Manager)
- MongoDB

### Clone the Repository

```bash
git clone https://github.com/Nikhil-Biyani/identity-reconciliation
cd identity-reconciliation
```

### Install Dependencies
```
npm install
```

### Set Environment Variables
Create a .env file in the root directory of the project and define the following variables:
```
PORT: 8000
MONGO_URL: Enter the MongoDB url to connect it with the database. Create a new database if you don't already have one.
```

### Start the Server
```
npm run server
```

### API Endpoint
```
POST /identify
Description: Identifies and consolidates customer identities based on provided email and phone number.
```

### Request Body:
```
{
  "email": "example@example.com",
  "phoneNumber": "1234567890"
}
```

### Response:
```
{
  "contact": {
    "primaryContatctId": "1234567890",
    "emails": ["example@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

### Error Responses:
Status Code 400
```
{
  "error": "Either email or phoneNumber must be provided"
}
```

Status Code 500
```
{
  "error": "Internal Server Error"
}
```

### Additional Notes
This service uses MongoDB as the database. Ensure MongoDB is running locally or provide the connection URI in the .env file.
The service provides error handling for various scenarios such as missing input, internal server errors, etc.
