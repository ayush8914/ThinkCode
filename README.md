# {  } ThinkCode
> Master Data Structures & Algorithms
 
ThinkCode is the ultimate platform to hone your coding skills, prepare for interviews, and compete with developers worldwide.
 
## 🌐 Live Demo
 
> Running locally at `http://98.70.34.170:3001`
 


## HLD

<img width="1900" height="900" alt="Screenshot 2026-04-18 at 2 31 35 AM" src="https://github.com/user-attachments/assets/65f97e16-1d43-4913-82f4-0465b32e39bf" />


## 📁 Project Structure
 
```
thinkcode/
├── apps/                  # TubroRepo - MonoRepo
│   ├── web/           # Primary frontend + backend
│   ├── judge-api/         # judge - api server  ( Express )
│   ├── judge-worker/          # judge-worker / code execution engine ( Node )
├── packages/
│   ├── ui/           
│   ├── types/         # common types for all
│   ├── db/            # prisma client and db model
├── docker/            # docker-compose for postgresql and pgadmin
├── k8s/               
│   ├── kind/          
│   │   ├── kind-config.yml
│   ├── redis/
│   │   ├── redis-service.yml
│   │   ├── redis-deployment.yml
│   │   ├── redis-pvc.yml
│   │   ├── redis-configmap.yml
│   ├── application/
│   │   ├── deployment.yml
│   │   ├── service.yml         
│   ├── judge-api/
│   │   ├── deployment.yml       
│   ├── judge-worker/
│   │   ├── deployment.yml
│   │   ├── hpa.yml
│   ├── configmap.yml
│   ├── secrets.yml            
└── scripts/
│   ├── build-images.sh
│   ├── deploy.sh
│   ├── setup.sh  
```

## 📸 Screenshots

### 🏠 Landing Page
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 28 54 PM" src="https://github.com/user-attachments/assets/7973b373-91e3-4104-819d-111093c76a2e" />

### 🔐 Authentication
| Sign In | Sign Up |
|--------|---------|
| <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 29 26 PM" src="https://github.com/user-attachments/assets/aa74485e-5092-4f8c-9829-323d51edac92" /> |<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 29 03 PM" src="https://github.com/user-attachments/assets/5f25870e-38f1-4073-8844-d68231884037" />|

### 📊 Dashboard
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 29 47 PM" src="https://github.com/user-attachments/assets/0a8db997-3616-4fae-9750-8c111c46bdbe" />

### 📋 Problems List
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 30 04 PM" src="https://github.com/user-attachments/assets/2f4b151e-4d8f-48a0-bf57-4254f8f5e7f1" />

### 💻 Problem Solving Interface
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 31 24 PM" src="https://github.com/user-attachments/assets/6c0ba9a1-b52b-4889-9e7c-f4c436fa3c77" />
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 31 09 PM" src="https://github.com/user-attachments/assets/339c78cb-bf38-41b6-9b11-a60dc166be5c" />

### 👤 User Profile
 
| Recent Submissions | Statistics |
|---|---|
| <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 31 43 PM" src="https://github.com/user-attachments/assets/f3980ca6-643d-4475-9590-d4cded053b80" /> | <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 31 53 PM" src="https://github.com/user-attachments/assets/2b86d0ae-44b4-421d-96e8-363e1af28f78" /> |

### 🛠️ Admin Panel
 
| Dashboard | Problem Management |
|---|---|
| <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 32 08 PM" src="https://github.com/user-attachments/assets/8b928680-2527-453a-85a2-183a8bc38f96" /> | <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 32 28 PM" src="https://github.com/user-attachments/assets/8f19251f-75ba-4104-98ab-12cf57f38713" />|

### ✍️ Create Problem
<img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 32 47 PM" src="https://github.com/user-attachments/assets/ae2dc2dc-c97f-47e4-aee1-6eadbcac91bb" />


### ⚡ Submission Results
 
| Compilation Error | Accepted | Time Limit Exceeded |
|---|---|---|
| <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 34 46 PM" src="https://github.com/user-attachments/assets/184ddb1e-c726-4190-8c09-2cc406824f4c" />| <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 34 59 PM" src="https://github.com/user-attachments/assets/9ba1e452-9d38-470b-a130-0d79ef28dde6" /> | <img width="1710" height="1030" alt="Screenshot 2026-04-17 at 12 36 35 PM" src="https://github.com/user-attachments/assets/b0abad70-6dbf-4e17-8f95-7279d90f6e42" /> |



---
 
## 🧑‍💻 Tech Stack
 
 
| Layer | Technology |
|---|---|
| Primary FE + BE | Next.js |
| some services | NodeJS / Express |
| Database | PostgreSQL / Prisma ORM / Pg Admin |
| Code Execution | Docker Sandbox / Kubenetes Pod , k8s HPA, deployments , services |
| Other | Redis Message Queue, Redis Cache(for problems and testcases) , Redis Pub-Sub, Websocket servers |


## 🚀 Getting Started
 
```bash
# Clone the repository
git clone https://github.com/your-username/thinkcode.git
 
# Navigate to the project
cd thinkcode
 
# Install dependencies
npm install
 
# Start the development server
npm run dev
```
