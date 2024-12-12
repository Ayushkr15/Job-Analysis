import puppeteer from "puppeteer-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import fs from 'fs';

// Use the stealth plugin to bypass bot detection
puppeteer.use(stealth());

// Utility function to introduce random delays (in milliseconds)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    let browser;

    try {
        // Launch Puppeteer with stealth plugin
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser', // Update if Chromium is installed elsewhere
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000); // 60 seconds

        // Set a custom user-agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/91.0.4472.124 Safari/537.36');

        // Define the job types to scrape
        const typeOfJobs = [
            'data-analyst',
            'frontend-developer',
            'backend-developer',
            'python-developer',
            'cloud-platform-engineer'
        ];

        let allJobs = []; // Array to store all scraped jobs across different job types

        // Iterate through each job type
        for (let jobType of typeOfJobs) {
            console.log(`\nScraping data for: ${jobType}`);
            const baseUrl = `https://www.naukri.com/${jobType}-jobs-in-india`;

            // Iterate through the first 10 pages for each job type
            for (let pageNum = 1; pageNum <= 10; pageNum++) {
                // Construct the URL based on the page number
                // Page 1: baseUrl
                // Page 2: baseUrl + '-2'
                // Page 3: baseUrl + '-3', etc.
                const url = pageNum === 1
                    ? baseUrl
                    : `${baseUrl}-${pageNum}`;

                console.log(`Navigating to Page ${pageNum} for ${jobType}: ${url}`);

                // Navigate to the constructed URL with retry logic
                let retries = 3;
                while (retries > 0) {
                    try {
                        await page.goto(url, { waitUntil: 'networkidle2' });
                        break; // Exit the retry loop if navigation is successful
                    } catch (err) {
                        retries--;
                        console.log(`Navigation to Page ${pageNum} failed. Retries left: ${retries}`);
                        if (retries === 0) throw err;
                        await sleep(3000); // Wait 3 seconds before retrying
                    }
                }

                const selector = '.srp-jobtuple-wrapper'; // Selector for job cards

                // Wait for the job card selector to appear
                try {
                    await page.waitForSelector(selector, { timeout: 60000 });
                } catch (err) {
                    console.log(`No job listings found on Page ${pageNum} for ${jobType}. Skipping to next job type.`);
                    break; // Exit the page loop and move to the next job type
                }

                // Extract job data from the current page
                const jobs = await page.evaluate((selector) => {
                    const jobElements = document.querySelectorAll(selector);
                    const jobData = [];

                    jobElements.forEach(job => {
                        // Extract specific data points from each job card
                    const jobTitleElement = job.querySelector('.title');
                    const companyElement = job.querySelector('.comp-dtls-wrap');
                    const locationElement = job.querySelector('.locWdth');
                    const experienceElement = job.querySelector('.expwdth');
                    const salaryElement = job.querySelector('.ni-job-tuple-icon.ni-job-tuple-icon-srp-rupee.sal');
                    const linkElement = job.querySelector('a');
                    const skillsListElement = job.querySelector('ul');

                    const jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : 'N/A';
                    const company = companyElement ? companyElement.querySelector('a') ? companyElement.querySelector('a').innerText.trim() : 'N/A' : 'N/A';
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const experience = experienceElement ? experienceElement.innerText.trim() : 'N/A';
                    const salary = salaryElement ? salaryElement.innerText.trim() : 'N/A';
                    const jobLink = linkElement ? linkElement.href : 'N/A';
                        
                        let skills = [];
                        if (skillsListElement) {
                            const skillItems = skillsListElement.querySelectorAll('li');
                            skillItems.forEach(item => {
                                const skill = item.innerText.trim();
                                if (skill) {
                                    skills.push(skill);
                                }
                            });
                        }

                        jobData.push({
                            jobTitle,
                            company,
                            location,
                            experience,
                            salary,
                            jobLink,
                            skills
                        });
                    });

                    return jobData; // Return only job data
                }, selector);

                console.log(`Total Jobs Found on Page ${pageNum} for ${jobType}: ${jobs.length}`);
                allJobs = allJobs.concat(jobs); // Aggregate jobs

                // Introduce a random delay between 2 to 5 seconds to mimic human behavior
                const delay = getRandomInt(2000, 5000); // 2000ms to 5000ms
                console.log(`Waiting for ${(delay / 1000).toFixed(3)} seconds before navigating to next page...`);
                await sleep(delay);
            }
        }

        console.log(`\nTotal Jobs Scraped: ${allJobs.length}`);
        // console.log(allJobs); // Consider commenting this out if the output is too large

        // Save all scraped jobs to a JSON file
        fs.writeFileSync('naukri_jobs.json', JSON.stringify(allJobs, null, 2));
        console.log('All job data saved to naukri_jobs.json');

    } catch (e) {
        console.log('Scrape failed:', e);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

run();
