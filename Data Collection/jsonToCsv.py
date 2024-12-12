import pandas as pd
import json

# Load the JSON file (correct the file extension to .json)
with open('/mnt/d/pyTensor/tf217/Job Analysis/Data Collection/naukri_jobs.json', 'r') as file:
    jobs_data = json.load(file)

# Create a list to store the job data with skills as a single string
job_data_list = []

# Iterate through each job in the JSON data
for job in jobs_data:
    job_entry = {
        "jobTitle": job.get("jobTitle", "N/A"),
        "company": job.get("company", "N/A"),
        "location": job.get("location", "N/A"),
        "experience": job.get("experience", "N/A"),
        "salary": job.get("salary", "N/A"),
        "jobLink": job.get("jobLink", "N/A"),
        "skills": ", ".join(job.get("skills", []))  # Join skills into a single string
    }
    job_data_list.append(job_entry)

# Convert the list of job entries into a DataFrame
df = pd.DataFrame(job_data_list)

# Save the DataFrame to a CSV file
df.to_csv('jobs_data.csv', index=False)

# Display the DataFrame (optional)
print("Done")