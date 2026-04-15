# NASA INTERNATIONAL SPACE APP CHALLENGE HONOUREE (GOT RECOGNITION AS HONOURABLE MENTIONS TOP2 FROM INDIA AND ONE OF THE 23 TEAM GLOBALLY, GLOBAL EVENT NOMINEE).

## 🌐 Live Demo

🚀 Experience Calyx in action:  
👉 https://plant-phenology-state-detector.vercel.app/


## 🎯 Project Objective

The core objective of **Calyx** is to achieve **"Global Phenology Intelligence"** — enabling anyone to understand:

- 🌸 When plants bloom  
- ⏳ How phenophases shift over time  
- 🐛 When pests are likely to occur  
- 🌍 How climate impacts ecosystems globally  

Unlike traditional systems limited to **local datasets**, Calyx aims to provide a **scalable, global prediction platform** by combining:

- Satellite climate data (NASA, ERA5)
- Citizen science biodiversity data (iNaturalist)
- Machine learning models

👉 Vision: **Democratize ecological intelligence for researchers, farmers, and conservationists**

---
## Images of the project-
**Home Page**
<img width="1919" height="977" alt="image" src="https://github.com/user-attachments/assets/1fda745b-4df0-4464-a762-5b3cfcd1eba4" />
**Map Page**
<img width="1919" height="980" alt="image" src="https://github.com/user-attachments/assets/90d38a6e-6d10-47f2-be0c-5be30b755538" />
**Wroking in Map Page with multiple pins**
<img width="1919" height="976" alt="image" src="https://github.com/user-attachments/assets/0003b7db-1eb9-4c75-ae98-442dc858be77" />
**Key Insight Page**
<img width="1919" height="984" alt="image" src="https://github.com/user-attachments/assets/5dba217f-6c26-4ee2-b119-19fb9c3a2613" />
**Data Portal**- the whole glimpse of the data is beign shared.
<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/8dce1702-297a-4105-a6cc-b10884f84de1" />
**Predictive Analysis of the Datset**
<img width="1919" height="975" alt="image" src="https://github.com/user-attachments/assets/bbedd7a3-7093-4c03-9323-2963ae4b309a" />
<img width="1919" height="972" alt="image" src="https://github.com/user-attachments/assets/ce2fecf7-8ad8-436a-9349-bb64b3271984" />
<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/142230c4-b36d-40ac-babc-782fd03b9440" />
<img width="1919" height="973" alt="image" src="https://github.com/user-attachments/assets/b419df91-77de-4be6-aec3-2b916ffca615" />







## 👥 Team & Contributions

Calyx was built as a collaborative effort where each member played a critical role in delivering a scalable, end-to-end system combining machine learning, backend engineering, and frontend experience.

---

## 🚀 Team Strength

What makes Calyx powerful:

- 💡 Deep ML research + real-world optimization  
- ⚙️ Strong system design and integration  
- 🎨 Clean, intuitive user experience  
- 🌍 Ability to scale from **local → global predictions**


## ⚙️ What We Built (End-to-End System)

Calyx is a **full-stack ML-powered system**, not just a model.

### 🧩 System Workflow

1. 🌍 User selects region on global map  
2. 📅 Chooses month & year  
3. ⚙️ Backend processes spatial + temporal input  
4. 🧠 ML models generate predictions  
5. 📊 Results visualized in frontend  

### 🔁 Pipeline Flow (Detailed Explanation)

The Calyx system follows a structured pipeline to transform raw environmental and biodiversity data into meaningful predictions:

---

### 1. 📥 Raw Data Collection

Data is collected from multiple global sources:

- NASA MERRA-2 (climate data)
- ERA5 (temperature, precipitation, radiation)
- iNaturalist (species observations)
- Köppen biome classifications

👉 This data includes spatial (location-based) and temporal (time-based) information.

---

### 2. 🧹 Data Cleaning & Preprocessing

- Removed inconsistent and noisy entries  
- Handled missing values in climate and species data  
- Normalized and aligned datasets across time and geography  

👉 Ensures reliable input for ML models.

---

### 3. 🏗️ Feature Engineering

- Extracted:
  - Temperature trends  
  - Seasonal patterns  
  - Regional climate signals  
- Mapped species data with:
  - Biomes  
  - Climate conditions  

👉 Converted raw data into **meaningful features** for prediction.

---

### 4. 🧠 Model Training

- Trained multiple models:
  - **XGBoost** → Phenology & pest prediction  
  - **LightGBM** → Climate & temperature modeling  
- Used:
  - Regression techniques  
  - Statistical correlations  

👉 Models learn relationships between climate and biological events.

---

### 5. ⚡ Model Serving (Inference Layer)

- Trained models are deployed in backend  
- APIs handle:
  - User input (region, time)  
  - Prediction requests  
- Optimized for:
  - Low latency  
  - Efficient computation  

👉 Converts models into real-time usable services.

---

### 6. 🎨 User Interface (Frontend)

- Interactive map for region selection  
- Displays:
  - Bloom predictions  
  - Phenophase timing  
  - Pest likelihood  
  - Climate insights  

👉 Makes complex ML outputs easy to understand.

---

### 🔄 End-to-End Flow Summary

User Input → Backend API → ML Models → Predictions → Visualization

## 🚧 Challenges & How We Solved Them

### 1. ⚡ Massive Data Handling (10GB → 80GB)

**Problem:**
- Extremely large datasets (climate + phenology)
- Memory and compute limitations

**Solution:**
- Efficient preprocessing pipelines  
- Chunk-based data handling  
- Feature reduction techniques  

---

### 2. ☁️ Cloud Free-Tier Constraints

**Problem:**
- Limited RAM & compute availability

**Solution:**
- Optimized model training (LightGBM over deep models)
- Reduced unnecessary computations
- Smart batching & caching strategies  

---

### 3. 🔄 Complex ML Problem (Sparse Labels)

**Problem:**
- Real-world ecological data is incomplete and noisy

**Solution:**
- Converted:
  👉 **Unsupervised → Semi-Supervised Learning**
- Leveraged:
  - Statistical correlations  
  - Climate-driven signals  

---

### 4. ⚙️ Heavy ML Pipeline

**Problem:**
- Multiple models + large-scale data = slow pipeline

**Solution:**
- Modular pipeline design  
- Parallel processing where possible  
- Model-specific optimization (XGBoost vs LightGBM)

---

### 5. 🔗 System Integration

**Problem:**
- Connecting ML models with real-time user queries

**Solution:**
- API-based architecture  
- Efficient backend routing  
- Optimized inference pipeline  

---

## 🌍 How Someone Can Use Calyx

Calyx is designed for:

### 👩‍🔬 Researchers
- Study climate-driven phenological shifts  
- Analyze biodiversity patterns  

### 🚜 Farmers
- Predict pest outbreaks  
- Plan crop cycles  

### 🌱 Conservationists
- Monitor ecosystem changes  
- Track species behavior  

### 📊 Policy Makers
- Understand climate impact  
- Support environmental planning  

---

## 🧑‍💻 Running Locally (Setup Guide)

### 🔧 Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- npm / yarn
- Git

---

### 📥 Clone the Repository

```bash
git clone https://github.com/your-username/calyx.git
cd calyx
````




