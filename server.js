import OpenAI from "openai";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const k1 = "sk-pr"
const k2 = "oj-Lrhww3MKD8yPQj"
const k3 = "EFQK1fT3BlbkFJ4rCxTDEd4Z2QFmcNSM6E"

const openai = new OpenAI({
  organization: 'org-RZ3uSWP75ShMsyLdXuc7Hot7',
  project: 'proj_0WEjxf45f4LX6KeADZdGKKdp',
  apiKey: k1+k2+k3
});

const { Client, Environment, ApiError } = require("square");
const express = require('express');
var bodyParser = require('body-parser')
const app = express();
var cors = require('cors')
const port = 3900;

app.use(cors())

const client = new Client({
    bearerAuthCredentials: {
      accessToken: "EAAAl8mxzywqmmkIFoERyfe8etwyLL1qPfWgcqMhN4N9MHG2XtOKHDjiWODCQCGb"
    },
    environment: Environment.Sandbox,
});

const { locationsApi } = client;

async function getLocations() {
  try {
    let listLocationsResponse = await locationsApi.listLocations();

    let locations = listLocationsResponse.result.locations;

    return locations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address.addressLine1 + ", " + location.address.locality
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      error.result.errors.forEach(function (e) {
        console.log(e.category);
        console.log(e.code);
        console.log(e.detail);
      });
    } else {
      console.log("Unexpected error occurred: ", error);
    }
    return [];
  }
};

let serverRes = "Server Res"

async function chat(query){

const assistant = await openai.beta.assistants.retrieve(
    "asst_l83vDzn9QleHAW2myQWCTJo7"
  );

const thread = await openai.beta.threads.create();

console.log("Got here " + query)

const message = await openai.beta.threads.messages.create(
  thread.id,
  {
    role: "user",
    content: query
  }
);

console.log("Got fucked")

let run = await openai.beta.threads.runs.createAndPoll(
  thread.id,
  { 
    assistant_id: assistant.id,
    instructions: "Keep answers short. Do not include lists in the response. Only answer questions related to interior decor and utilities"
  }
);

console.log("Got fucked")


    const retrieveRun = async () => {
      let keepRetrievingRun;
      console.log("Getting Fucked")
      while (run.status !== "completed") {
        run = await openai.beta.threads.runs.retrieve(
          thread.id, // Use the stored thread ID for this user
          run.id
        );

        console.log(`Run status: ${run.status}`);

        if (run.status === "completed") {
	      const messages = await openai.beta.threads.messages.list(
    	   run.thread_id
  	    );
        for (const message of messages.data) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
          serverRes = message.content[0].text.value;
          return message.content[0].text.value;
        }
       }
      }
      if (run.status === "completed") {
	      const messages = await openai.beta.threads.messages.list(
    	   run.thread_id
  	    );
        for (const message of messages.data) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
          serverRes = message.content[0].text.value;
          return message.content[0].text.value;
        }
       }
    };
    return await retrieveRun();
}


async function getItems() {
  try {
    const response = await client.catalogApi.listCatalog();
    return response.result;
  } catch(error) {
    console.log(error);
    throw error; // Re-throw the error to handle it in the route handler
  }
}

async function searchItems(query) {
try {
  const response = await client.catalogApi.searchCatalogItems({
    textFilter: query,
    archivedState: 'ARCHIVED_STATE_ALL'
  });
  console.log(response.result);
  return response.result
} catch(error) {
  console.log(error);
}
}

var rawParses = bodyParser.raw()

app.post('/chat', express.raw({ type: '*/*' }), async (req, res) => {
        const inputString = req.body.toString();
        console.log("Input String : " + inputString)
        const processedString = await chat(inputString);
        res.send(processedString);

});

app.get('/items', async (req, res) => {
  try {
    const items = await getItems();
    console.log(items)
    res.json( [ { ItemName : items.objects[0].itemData.name , ItemDesc : items.objects[0].itemData.description } ] );
  } catch (error) {
    console.log(error)	
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/searchItems', async (req, res) => {
  const searchQuery = req.query.searchQuery;
  try {
    const items = await searchItems(searchQuery);
    console.log(items.items)
    var responseItems = {}
    if(items.items)
    {
       responseItems = items.items.map(item => {
console.log(item.customAttributeValues.productInfo)
      return { ItemName: item.itemData.name, ItemDesc: item.customAttributeValues.productInfo.stringValue, ItemSeller: item.customAttributeValues.seller.stringValue , ItemPrice: item.customAttributeValues.price.stringValue , ItemLat: item.customAttributeValues.lat.stringValue , ItemLon: item.customAttributeValues.lng.stringValue, ItemAddr: item.customAttributeValues.addr.stringValue, ItemID: item.id };
    });
    }
    console.log(responseItems)
    res.json(responseItems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/locations', async (req, res) => {
  try {
    const locations = await getLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
