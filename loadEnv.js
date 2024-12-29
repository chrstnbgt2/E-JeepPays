const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envFile = path.resolve(__dirname, '.env');
const outputFile = path.resolve(__dirname, 'android', 'gradle.properties');

if (fs.existsSync(envFile)) {
    const envConfig = dotenv.parse(fs.readFileSync(envFile));
    const gradleProperties = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(outputFile, gradleProperties);
    console.log('Environment variables successfully written to gradle.properties');
} else {
    console.warn('.env file not found!');
}
