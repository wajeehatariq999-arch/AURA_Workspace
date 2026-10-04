✨ AURA Marketplace

🛍️ AI-Powered Marketplace & Business Management Platform

AURA Marketplace is a full-stack web application that combines a
modern online shopping experience with intelligent business management
and AI assistance.

🌐 Live Demo: https://aura-workspace.fastapicloud.dev\
💻 GitHub: https://github.com/wajeehatariq999-arch/AURA_Workspace

🌟 About AURA Marketplace

AURA Marketplace connects two sides of a business in one platform:

👔 Business Owner

Manage products, inventory, orders, suppliers, analytics, business
documents and AI-powered operations.

🛍️ Customer

Create an account, browse products, place orders, view personal orders
and ask AURA about products, orders and store policies.

🤖 AURA AI

AURA provides focused answers using authorized business data and
information uploaded by the owner.

The goal is simple:

Make business management smarter and customer shopping easier.

👔 01 --- BUSINESS OWNER

The Business Owner has access to the complete management side of AURA
Marketplace.

🏠 Business Dashboard

The owner can see important business information in one place:

📦 Total orders

💰 Revenue

🛍️ Number of products

⚠️ Low-stock products

🧾 Recent orders

📊 Business activity

This gives the owner a quick understanding of what is happening in the
business.

🛍️ Product Management

The owner can:

Add products

Edit products

Create categories

Set product prices

Manage stock

Add product images

Maintain the customer-facing catalog

Products managed by the owner are displayed in the marketplace for
customers.

📦 Inventory Management

AURA helps the owner monitor stock levels.

The owner can ask AURA questions such as:

Which products need restocking?

AURA can use the current inventory information to provide a focused
answer.

🧾 Order Management

The owner can:

View customer orders

Check order status

Review order details

Monitor recent orders

Understand current order activity

Example:

What is the current order situation?

AURA can use the actual business order information to answer.

🚚 Supplier Management

The owner can maintain supplier information including:

Supplier name

Contact person

Email

Phone

Address

Supplier information can also support inventory and business workflows.

📊 Analytics

The owner can review business information such as:

Orders

Revenue

Product activity

Inventory conditions

Business trends

This helps the owner make better operational decisions.

📚 Owner Knowledge Base

One of the most important features of AURA Marketplace is the
Knowledge Base.

The owner can upload business documents such as:

📄 Return policies

🚚 Delivery policies

💳 Refund information

🛍️ Product information

❓ Frequently asked questions

📋 Business procedures

Supported files:

PDF • DOCX • TXT

These files become searchable business knowledge for AURA.

🤖 AURA AI FOR THE OWNER

The owner can ask AURA questions related to the business.

Example questions

📦 Which products are low in stock?

🧾 What is the current order situation?

📊 Which products need attention?

📚 What does our uploaded return policy say?

AURA is designed to give short, relevant and business-focused
answers.

🛍️ 02 --- CUSTOMER

The customer side of AURA Marketplace works as a modern online store.

Customers can:

👤 Create their own account

🔐 Sign in

🛍️ Browse products

🖼️ View product images

💰 View prices

📦 Place orders

🧾 View their orders

🤖 Ask AURA for help

👤 Customer Account

Customers can create their own account without needing the owner to
create it for them.

After signing in, the customer can use the marketplace and access their
own order information.

🛒 Shopping Experience

Customers can browse different types of products, including:

👕 Clothes

👟 Shoes

💍 Jewellery

👜 Bags

🧴 Body Care

🏠 Home Products

🎧 Electronics

🎁 Gift Products

The customer can view available product information and place an order.

📦 Customer Orders

After placing an order, the customer can view information about their
own order.

For example:

What is my latest order?

What is the status of my order?

AURA can answer using the customer's authorized order information.

🔐 CUSTOMER PRIVACY

Customer information is protected by backend authorization.

A customer can access:

✅ Their own orders

A customer cannot access:

❌ Another customer's orders
❌ Another customer's private information
❌ Owner-only business analytics

This protection is handled on the backend, not only by hiding buttons in
the frontend.

📚 OWNER FILES → CUSTOMER ANSWERS

This is an important part of AURA Marketplace.

The owner can upload a business document, and AURA can use that
information when answering a relevant customer question.

Example

The owner uploads:

Return Policy.pdf

A customer asks:

What is your return policy?

AURA searches the owner's business knowledge and gives a simple answer
based on the relevant information.

This means the customer can receive information directly from the
business's own documents.

🧠 HOW AURA USES DOCUMENTS

AURA uses Retrieval-Augmented Generation (RAG).

The basic process is:

Owner uploads document
↓
Text is extracted
↓
Information is divided into searchable sections
↓
Sentence Transformers create embeddings
↓
ChromaDB stores the searchable knowledge
↓
Customer or owner asks a question
↓
AURA finds the relevant information
↓
AI gives a focused answer

The important point is that AURA does not need to use the entire
document for every question.

It looks for the information relevant to the question.

🎯 AURA AI --- FOCUSED ANSWERS

AURA is not designed to be a general-purpose chatbot.

It focuses on questions related to:

🛍️ Products

📦 Orders

📊 Inventory

🚚 Suppliers

💰 Business information

📚 Owner-uploaded documents

🚛 Store policies

👤 Customer support

🚫 Unrelated Questions

If someone asks AURA something unrelated to the marketplace or business,
AURA should politely refuse to go outside its purpose.

For example:

Sorry, this question is not related to AURA Marketplace. I can help
with products, orders, store policies and other marketplace-related
information.

This rule applies to both:

👔 Business Owner

and

🛍️ Customer

💬 AI SUGGESTION BUTTONS

AURA also provides suggested questions to make the AI easier to use.

For example:

Which products need restocking?

What is today's order situation?

Show low-stock products.

When a user clicks a suggestion:

The question is placed into the AI input box.

The user can review it.

The user runs the question.

AURA gives the relevant answer.

This makes the AI interface simple for non-technical users.

🤖 AI WORKFLOW

AURA follows a controlled workflow:

User asks a question

↓

AURA identifies what the question is about

↓

Relevant business data or Knowledge Base is selected

↓

Authorized information is retrieved

↓

AI generates a short answer

This helps keep answers focused and relevant.

🧩 BUSINESS AI AREAS

AURA can work with different business areas such as:

👤 Customer Support

🧾 Orders

📦 Inventory

🚚 Suppliers

📊 Analytics

📚 Business Knowledge

The purpose is to use the appropriate information for each question.

✅ APPROVAL CENTER

AURA supports human control over important business actions.

For example:

AI prepares an action

↓

Action becomes pending

↓

Owner/Admin reviews it

↓

Approve or Reject

↓

Action is completed or stopped

This means the AI does not automatically control important business
operations without human oversight.

📝 AGENT ACTIVITY

The owner can review AI-related activity.

This helps make the AI workflow more transparent.

The system can keep track of:

AI runs

Agent activity

Business actions

Approval requests

Important events

🔐 SECURITY & AUDIT

AURA includes security features designed to protect business and
customer information.

🔑 Authentication

Password hashing

Secure authentication

HttpOnly authentication cookies

CSRF protection

🛡️ Authorization

Different users receive different permissions:

👑 Owner

🛠️ Admin

👩‍💼 Staff

🛍️ Customer

🔒 Privacy

Customer orders are protected

Business data is scoped to the correct business

Owner documents are protected

Sensitive information is not exposed to unauthorized users

📝 Audit

Important business activity can be recorded for traceability.

🏗️ SYSTEM ARCHITECTURE

AURA Marketplace is a real full-stack application.

Frontend

HTML + CSS + JavaScript

The frontend provides:

Marketplace interface

Business dashboard

Customer experience

AI interface

Product management

Order management

Knowledge Base

Analytics

Security pages

Backend

Python + FastAPI

The backend handles:

Authentication

Authorization

Products

Orders

Inventory

Suppliers

AI

RAG

Documents

Approvals

Audit logs

Database

SQLite + SQLAlchemy

Stores business and application data such as:

Users

Products

Categories

Orders

Inventory

Suppliers

Documents

Approvals

Audit records

AI

Groq

Used for AI-powered responses and business assistance.

Knowledge Retrieval

Sentence Transformers + ChromaDB

Used to search owner-uploaded business knowledge.

🧰 TECHNOLOGY STACK

Technology                 Purpose

🐍 Python                  Backend development
⚡ FastAPI                 REST API and web backend
🎨 HTML/CSS/JavaScript     Frontend
🗃️ SQLite                  Database
🔗 SQLAlchemy              Database ORM
🤖 Groq                    AI
🧠 Sentence Transformers   Embeddings
🔎 ChromaDB                Vector search / RAG
📄 PDF/DOCX/TXT            Business knowledge
🔐 JWT / Cookies           Authentication
🛡️ CSRF                    Request protection
☁️ FastAPI Cloud           Deployment

📁 PROJECT STRUCTURE

AURA/
│
├── app/
│   ├── api/
│   ├── services/
│   ├── models.py
│   ├── database.py
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   └── templates/
│
├── data/
│   ├── documents/
│   ├── product_images/
│   └── vector_store/
│
├── requirements.txt
├── run.py
├── seed.py
├── .env.example
└── README.md

🚀 RUN AURA LOCALLY

1️⃣ Create the virtual environment

py -3.14 -m venv .venv
.venv\Scripts\activate

2️⃣ Install dependencies

pip install -r requirements.txt

3️⃣ Configure environment variables

Create a .env file using .env.example.

Example:

SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-api-key

⚠️ Never upload .env or API keys to a public GitHub repository.

4️⃣ Seed the application

python seed.py

5️⃣ Start AURA

python run.py

Open:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs

🌐 LIVE DEPLOYMENT

✨ AURA Marketplace

Live Application

https://aura-workspace.fastapicloud.dev

GitHub Repository

https://github.com/wajeehatariq999-arch/AURA_Workspace

AURA is deployed as a real FastAPI web application.

🎬 MENTOR DEMO

The following flow gives a quick understanding of the complete project.

👔 Part 1 --- Business Owner

Step 1

Sign in as the Business Owner.

Step 2

Show the dashboard:

Orders

Revenue

Products

Low stock

Recent orders

Step 3

Show:

Products → Inventory → Orders → Suppliers → Analytics

Step 4

Open:

Knowledge Base

Upload a sample business document.

Step 5

Open:

Ask AURA

Ask:

Which products need restocking?

Then:

What is the current order situation?

Then ask a question related to the uploaded document.

Step 6

Show:

Approval Center → Agent Activity → Security & Audit

🛍️ Part 2 --- Customer

Step 1

Sign out from the owner account.

Step 2

Create a customer account.

Step 3

Browse the marketplace.

Step 4

Open a product.

Step 5

Place an order.

Step 6

Ask AURA:

What is my latest order?

Then:

What is the price of this product?

Then ask a question about the store policy uploaded by the owner.

Step 7

Ask an unrelated question.

AURA should politely explain that it only handles AURA
Marketplace-related information.

🎯 PROJECT HIGHLIGHTS

🛍️ Complete Marketplace

Customers can browse products and place orders.

👔 Business Management

Owners can manage products, inventory, orders and suppliers.

🤖 Focused AI

AURA answers questions related to the marketplace and business.

📚 Owner Knowledge

Business documents can be uploaded and used as AI knowledge.

🧠 RAG

Relevant information is retrieved from owner-uploaded documents.

🔐 Role-Based Security

Different users receive different permissions.

🛡️ Customer Privacy

Customers can access their own order information.

✅ Human Approval

Important AI actions can require owner/admin approval.

📊 Business Insights

Owners can understand business activity through analytics.

🌐 Real Deployment

The project runs as a deployed FastAPI application.

💎 WHY AURA MARKETPLACE?

A normal online store mainly provides:

Products → Orders

A normal chatbot mainly provides:

Question → Answer

AURA Marketplace combines both:

🛍️ Shopping



👔 Business Operations



📚 Business Knowledge



🤖 AI Assistance



🔐 Secure Access



✅ Human Control

This creates one connected platform for both the business owner and the
customer.

🌱 FUTURE POSSIBILITIES

AURA Marketplace can be expanded with:

💳 Online payment integration

🚚 Delivery/shipping integration

🔔 Customer notifications

⭐ Product reviews

❤️ Wishlist

🎯 Personalized recommendations

📈 Advanced business reports

🤖 More specialized AI agents

📱 More mobile-friendly features

🌍 Multi-business support

🏁 FINAL SUMMARY

✨ AURA Marketplace

A full-stack marketplace where customers shop simply, business owners
manage intelligently, and AURA AI answers from authorized business
information.

The project demonstrates:

Full-Stack Development • E-Commerce • AI • RAG • Vector Search •
Database Design • Authentication • Authorization • Customer Privacy •
Business Analytics • Human-in-the-Loop AI • Deployment

💫 AURA Marketplace

Shop simply. Manage intelligently. Ask AURA.