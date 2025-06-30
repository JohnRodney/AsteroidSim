const axios = require("axios");

async function testJPL() {
  try {
    console.log("Testing JPL API...");

    const response = await axios.get("https://ssd-api.jpl.nasa.gov/sbdb.api", {
      params: {
        des: "1",
      },
      timeout: 10000,
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response data keys:", Object.keys(response.data));

    if (response.data.object) {
      console.log("Asteroid ID:", response.data.object.spkid);
      console.log("Asteroid name:", response.data.object.shortname);
      console.log("Orbit class:", response.data.object.orbit_class?.name);

      if (response.data.orbit && response.data.orbit.elements) {
        console.log(
          "Orbital elements found:",
          response.data.orbit.elements.length
        );
      }
    } else {
      console.log("No object data found");
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testJPL();
