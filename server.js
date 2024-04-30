const { Client, Environment, ApiError } = require("square");
const express = require('express');
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
