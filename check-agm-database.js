const { API_BASE_URL } = require("./src/config");

const checkAGMDatabase = async () => {
  try {
    console.log("=== Checking AGM Database from Mobile App ===");
    console.log("API Base URL:", API_BASE_URL);
    console.log("Current time:", new Date().toISOString());

    // Test basic API connectivity
    console.log("\n1. Testing API connectivity...");
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        timeout: 5000,
      });
      console.log(
        "API Health Check:",
        healthResponse.status,
        healthResponse.statusText
      );
    } catch (healthError) {
      console.log("API Health Check: ❌ Failed -", healthError.message);
    }

    // Test AGM endpoint without authentication first
    console.log("\n2. Testing AGM endpoint (without auth)...");
    try {
      const agmResponse = await fetch(`${API_BASE_URL}/agm`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("AGM Endpoint Status:", agmResponse.status);
      console.log("AGM Endpoint Status Text:", agmResponse.statusText);

      const responseText = await agmResponse.text();
      console.log("Response length:", responseText.length);
      console.log("Response preview:", responseText.substring(0, 300));

      if (agmResponse.status === 401) {
        console.log(
          "✅ Expected 401 (authentication required) - endpoint exists"
        );
      } else if (agmResponse.status === 404) {
        console.log("❌ 404 - AGM endpoint doesn't exist");
      } else if (agmResponse.status === 500) {
        console.log("❌ 500 - Server error (likely database issue)");
        if (responseText.includes('column "notes" does not exist')) {
          console.log(
            "🔍 FOUND THE ISSUE: Notes column missing from database!"
          );
        }
      }
    } catch (agmError) {
      console.log("❌ AGM endpoint error:", agmError.message);
    }

    // Test with a dummy token to trigger the specific database query
    console.log(
      "\n3. Testing AGM endpoint with dummy token (to trigger database query)..."
    );
    try {
      const tokenTestResponse = await fetch(`${API_BASE_URL}/agm`, {
        method: "GET",
        headers: {
          Authorization: "Bearer dummy_token_for_testing_database_schema",
          "Content-Type": "application/json",
        },
      });

      const responseText = await tokenTestResponse.text();
      console.log("Token Test Status:", tokenTestResponse.status);
      console.log("Token Test Response:", responseText);

      // Check for specific database errors
      if (responseText.includes('column "notes" does not exist')) {
        console.log(
          "\n❌ CONFIRMED: Notes column is missing from PostgreSQL database table!"
        );
        console.log(
          "🔧 Your Sequelize model (agm.js) defines 'notes' column but database table doesn't have it"
        );
        console.log("🔧 Backend team needs to run this SQL command:");
        console.log("   ALTER TABLE agm ADD COLUMN notes TEXT;");
        console.log(
          "🔧 Or run Sequelize sync: sequelize.sync({ alter: true })"
        );
      } else if (responseText.includes('relation "agm" does not exist')) {
        console.log("❌ CONFIRMED: AGM table doesn't exist in database!");
      } else if (
        responseText.includes("Invalid token") ||
        responseText.includes("Unauthorized") ||
        responseText.includes("jwt")
      ) {
        console.log("✅ Database schema seems OK - just authentication issue");
      } else if (
        responseText.includes("error") ||
        responseText.includes("Error")
      ) {
        console.log("❌ Other database error detected");
      }
    } catch (tokenError) {
      console.log("❌ Token test error:", tokenError.message);
    }

    // Test user validation endpoint (which mobile app actually uses)
    console.log("\n4. Testing user validation endpoint (mobile auth)...");
    try {
      const userValidateResponse = await fetch(
        `${API_BASE_URL}/user/validateUser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "test_user",
            password: "test_password",
          }),
        }
      );

      const userResponseText = await userValidateResponse.text();
      console.log("User Validate Status:", userValidateResponse.status);
      console.log(
        "User Validate Response:",
        userResponseText.substring(0, 200)
      );
    } catch (userError) {
      console.log("❌ User validate error:", userError.message);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔍 DIAGNOSIS SUMMARY");
    console.log("=".repeat(50));
    console.log("Your AGM Sequelize model defines these columns:");
    console.log("  - id (INTEGER, PRIMARY KEY, AUTO INCREMENT)");
    console.log("  - agm_date (DATE, NOT NULL)");
    console.log("  - agenda (TEXT, NULLABLE)");
    console.log(
      "  - notes (TEXT, NULLABLE) ← This might be missing from actual DB table"
    );
    console.log("");
    console.log("If you see 'column notes does not exist' error above:");
    console.log("  ❌ Database table structure doesn't match your model");
    console.log("  🔧 Run this SQL in your PostgreSQL database:");
    console.log("     ALTER TABLE agm ADD COLUMN notes TEXT;");
    console.log("");
    console.log("If you see authentication errors only:");
    console.log("  ✅ Database schema is fine, just need valid login");
  } catch (error) {
    console.error("❌ Check script error:", error.message);
    console.error("Stack trace:", error.stack);
  }
};

// Run the check
console.log("Starting AGM Database Check...");
checkAGMDatabase();
