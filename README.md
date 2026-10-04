✨ AURA Marketplace

🛍️ AI-Powered Marketplace & Business Management Platform

Shop simply. Manage intelligently. Ask AURA.

AURA Marketplace is a full-stack web application that combines a customer shopping experience with business management and focused AI assistance.

🌐 Live Demo: https://aura-workspace.fastapicloud.dev
💻 GitHub: https://github.com/wajeehatariq999-arch/AURA_Workspace

🌟 What is AURA Marketplace?

AURA Marketplace brings two sides of a business into one platform:

👔 Business Owner — manages products, inventory, orders, suppliers, analytics, documents and AI-assisted operations.

🛍️ Customer — creates an account, browses products, places orders and asks AURA about marketplace-related information.

🤖 AURA AI — gives short, focused answers using authorized business data and owner-uploaded knowledge.

💡 Main idea

AURA is not just an online store and it is not just a chatbot.

It combines:

🛍️ E-Commerce + 👔 Business Operations + 🤖 AI + 📚 RAG + 🔐 Security + ✅ Human Approval

🗺️ AURA AT A GLANCE

                         ✨ AURA MARKETPLACE ✨
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
                 ▼                                 ▼
          👔 BUSINESS OWNER                   🛍️ CUSTOMER
                 │                                 │
       ┌─────────┼─────────┐             ┌────────┼────────┐
       │         │         │             │        │        │
    Products   Orders   Inventory      Browse   Orders   Ask AURA
       │         │         │             │        │        │
       └─────────┼─────────┘             └────────┼────────┘
                 │                                 │
                 ▼                                 ▼
          📚 KNOWLEDGE BASE                 🧾 CUSTOMER DATA
                 │
                 ▼
              🤖 AURA AI
                 │
                 ▼
        Short + Relevant Answers

👔 01 — BUSINESS OWNER

The Business Owner has access to the complete business management side of AURA Marketplace.

🏠 Business Dashboard

The dashboard gives the owner a quick overview of:

📦 Total orders

💰 Revenue

🛍️ Total products

⚠️ Low-stock products

🧾 Recent orders

📊 Business activity

The owner can immediately see what needs attention.

🛍️ Product Management

The owner can:

➕ Add products

✏️ Edit products

🗂️ Manage categories

💰 Set prices

📦 Manage stock

🖼️ Add product images

🛒 Maintain the customer-facing catalog

Changes made to products are reflected in the marketplace.

📦 Inventory Management

AURA helps the owner monitor stock.

Example:

Which products need restocking?

AURA checks the available inventory information and provides a focused answer.

🧾 Order Management

The owner can:

View customer orders

Check order status

Review order details

Monitor recent orders

Understand order activity

Example:

What is the current order situation?

AURA can use the business order data to answer.

🚚 Supplier Management

The owner can manage:

🏢 Supplier name

👤 Contact person

📧 Email

📞 Phone

📍 Address

Supplier information can support inventory and other business workflows.

📊 Analytics

The owner can review:

Orders

Revenue

Product activity

Inventory conditions

Business trends

This helps the owner understand the current state of the business.

📚 OWNER KNOWLEDGE BASE

The owner can upload business information that AURA can use when answering relevant questions.

Supported files

📄 PDF

📝 DOCX

📃 TXT

Example documents

Return policy

Refund policy

Delivery policy

Product information

Store FAQs

Business procedures

The uploaded information becomes searchable business knowledge.

🤖 AURA AI FOR THE OWNER

The owner can ask AURA questions related to the business.

Example questions

📦 Which products are low in stock?

🧾 What is the current order situation?

📊 Which products need attention?

📚 What does the uploaded return policy say?

AURA is designed to give simple, short and relevant answers.

🛍️ 02 — CUSTOMER

The customer side provides the shopping experience.

Customers can:

👤 Create an account

🔐 Sign in

🛍️ Browse products

🖼️ View product images

💰 View prices

📦 Place orders

🧾 View their own orders

🤖 Ask AURA

👤 Customer Account

Customers can create their own accounts.

They do not need the owner to create an account for them.

After signing in, customers can use the marketplace and access their own order information.

🛒 Shopping Experience

The marketplace can contain products such as:

👕 Clothes

👟 Shoes

💍 Jewellery

👜 Bags

🧴 Body Care

🏠 Home Products

🎧 Electronics

🎁 Gift Products

📦 Customer Orders

Customers can place orders and view their own order information.

Example:

What is my latest order?

What is the status of my order?

AURA can answer using information that belongs to the logged-in customer.

📚 OWNER FILES → CUSTOMER ANSWERS

This is one of the important features of AURA Marketplace.

The owner uploads a business document.

A customer later asks a related question.

AURA retrieves the relevant information and gives a simple answer.

Example

👔 Owner uploads:

Return Policy.pdf

🛍️ Customer asks:

What is your return policy?

🤖 AURA:

Gives a short answer based on the relevant information from the owner's uploaded document.

This makes the AI useful for real business information instead of inventing answers.

🧠 RAG — HOW OWNER FILES BECOME AI KNOWLEDGE

AURA uses Retrieval-Augmented Generation (RAG).

📄 Owner uploads PDF / DOCX / TXT
                 │
                 ▼
          Text Processing
                 │
                 ▼
       Text is divided into
        searchable sections
                 │
                 ▼
     🧠 Sentence Transformers
            create embeddings
                 │
                 ▼
             🔎 ChromaDB
          stores vector data
                 │
                 ▼
          🛍️ Customer asks
            a question
                 │
                 ▼
       Relevant information
             is retrieved
                 │
                 ▼
             🤖 Groq AI
                 │
                 ▼
       💬 Simple, relevant answer

The important idea is:

AURA retrieves the information relevant to the question instead of blindly using everything.

🎯 AURA AI — FOCUSED QUESTIONS

AURA is not intended to be a general-purpose chatbot.

It focuses on the marketplace and business.

✅ Questions AURA can handle

🛍️ Products

💰 Product prices

📦 Product availability

🧾 Orders

📊 Inventory

🚚 Suppliers

📚 Store policies

📄 Owner-uploaded documents

💼 Business information

🚫 Unrelated Questions

If someone asks something outside AURA Marketplace, AURA should politely explain its scope.

Example:

Sorry, this question is not related to AURA Marketplace. I can help with products, orders, store policies and other marketplace-related information.

This rule applies to:

👔 Business Owner

🛍️ Customer

💬 AI SUGGESTION BUTTONS

AURA can show suggested questions above the AI input.

For example:

Which products need restocking?

What is today's order situation?

Show low-stock products.

When the user clicks a suggestion:

💡 Suggested Question
        │
        ▼
📝 Added to AI input box
        │
        ▼
👤 User can review/edit it
        │
        ▼
🤖 Ask AURA
        │
        ▼
💬 Relevant answer

This makes the AI easier to use, especially for non-technical users.

🔐 CUSTOMER PRIVACY

A customer can access their own information.

✅ Allowed

Their own orders

Their own order status

Their own customer information

❌ Not allowed

Another customer's orders

Another customer's private information

Owner-only analytics

Owner-only business data

The backend applies authorization rather than relying only on frontend visibility.

🧩 AI BUSINESS AREAS

AURA can work with different business areas:

                  🤖 AURA AI
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
   🛍️ Products      📦 Orders       📊 Inventory
       │               │               │
       └───────────────┼───────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        🚚 Suppliers       📚 Knowledge

The goal is to use the most relevant information for the user's question.

✅ APPROVAL CENTER

AURA supports human-in-the-loop business operations.

Important actions can require owner/admin approval.

🤖 AI prepares an action
          │
          ▼
      ⏳ Pending
          │
          ▼
👔 Owner / Admin reviews
       │       │
       ▼       ▼
   ✅ Approve  ❌ Reject
       │
       ▼
  Action completed
       │
       ▼
   📝 Audit record

The owner remains in control.

📝 AGENT ACTIVITY

The owner can review AI-related activity and important system events.

This helps make the AI workflow more transparent.

Examples include:

🤖 AI runs

🔧 Agent activity

✅ Approval actions

📝 Important business events

🔐 SECURITY & AUDIT

AURA includes multiple security layers.

🔑 Authentication

Password hashing

Secure authentication

HttpOnly authentication cookies

CSRF protection

🛡️ Role-Based Authorization

Different users have different permissions:

👑 Owner

🛠️ Admin

👩‍💼 Staff

🛍️ Customer

🔒 Data Protection

Customer orders are protected

Business data is isolated

Owner documents are protected

Unauthorized users cannot access restricted information

📝 Audit

Important business activity can be recorded for traceability.

🏗️ SYSTEM ARCHITECTURE

┌───────────────────────────────────────────────┐
│              ✨ AURA MARKETPLACE ✨            │
├───────────────────────────────────────────────┤
│                                               │
│   🎨 FRONTEND                                 │
│   HTML + CSS + JavaScript                     │
│                    │                          │
│                    ▼                          │
│   ⚡ FASTAPI BACKEND                          │
│                    │                          │
│        ┌───────────┼───────────┐              │
│        ▼           ▼           ▼              │
│    🔐 Auth     🛍️ Business   🤖 AI/RAG       │
│        │           │           │              │
│        │           ▼           ▼              │
│        │       🗃️ SQLite    🔎 ChromaDB       │
│        │       + SQLAlchemy      │             │
│        │                         ▼             │
│        │                      🧠 Groq          │
│        │                                       │
└────────┴───────────────────────────────────────┘

🗄️ MAIN DATA AREAS

Area

Purpose

👤 Users

Authentication and roles

🏢 Businesses

Business ownership and isolation

🗂️ Categories

Product organization

🛍️ Products

Marketplace catalog

📦 Inventory

Stock management

🧾 Orders

Customer purchases

🚚 Suppliers

Supplier management

📚 Documents

Owner knowledge

🔎 Vector Store

RAG / semantic retrieval

✅ Approvals

Human approval workflow

🤖 Agent Activity

AI activity tracking

📝 Audit Logs

Traceability and security

🧰 TECHNOLOGY STACK

Technology

Purpose

🐍 Python

Backend development

⚡ FastAPI

REST API and web backend

🎨 HTML / CSS / JavaScript

Frontend

🗃️ SQLite

Database

🔗 SQLAlchemy

Database ORM

🤖 Groq

AI responses

🧠 Sentence Transformers

Embeddings

🔎 ChromaDB

Vector search / RAG

📄 PDF / DOCX / TXT

Business knowledge

🔐 JWT / Cookies

Authentication

🛡️ CSRF

Request protection

☁️ FastAPI Cloud

Deployment

📁 PROJECT STRUCTURE

The following paths show where the main parts of AURA are located.

AURA/
│
├── app/
│   ├── api/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   ├── suppliers.py
│   │   └── ...
│   │
│   ├── services/
│   │   ├── agentic.py
│   │   ├── rag.py
│   │   └── ...
│   │
│   ├── models.py
│   ├── database.py
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   │
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

📌 Important folders

app/api/
Backend API routes for authentication, products, orders, suppliers and other modules.

app/services/
AI, RAG and business service logic.

frontend/templates/
HTML pages/templates.

frontend/static/
Frontend CSS and JavaScript.

data/documents/
Owner-uploaded business documents.

data/product_images/
Product images used by the marketplace.

data/vector_store/
Vector/RAG storage used for knowledge retrieval.

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

🌐 Live Application:
https://aura-workspace.fastapicloud.dev

💻 GitHub Repository:
https://github.com/wajeehatariq999-arch/AURA_Workspace

AURA is deployed as a real FastAPI web application.

🎬 MENTOR DEMO

A mentor can understand the complete project using two simple parts.

👔 PART 1 — BUSINESS OWNER

Step 1

Sign in as the Business Owner.

Step 2

Show the dashboard:

📦 Orders

💰 Revenue

🛍️ Products

⚠️ Low stock

🧾 Recent orders

Step 3

Open:

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

Then ask something related to the uploaded document.

Step 6

Show:

Approval Center → Agent Activity → Security & Audit

🛍️ PART 2 — CUSTOMER

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

AURA should politely explain that it only handles AURA Marketplace-related information.

🎯 PROJECT HIGHLIGHTS

🛍️ Complete Marketplace

Customers can browse products and place orders.

👔 Business Management

Owners can manage products, inventory, orders and suppliers.

🤖 Focused AI

AURA answers marketplace and business-related questions.

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

Products → Cart → Order

A simple chatbot mainly provides:

Question → Answer

AURA Marketplace brings both together:

🛍️ SHOPPING
     │
     ▼
👔 BUSINESS OPERATIONS
     │
     ▼
📚 BUSINESS KNOWLEDGE
     │
     ▼
🤖 AI ASSISTANCE
     │
     ▼
🔐 SECURE ACCESS
     │
     ▼
✅ HUMAN CONTROL

The result is one connected platform for both the business owner and the customer.

🌱 FUTURE POSSIBILITIES

AURA Marketplace can be expanded with:

💳 Online payment integration

🚚 Delivery and shipping integration

🔔 Customer notifications

⭐ Product reviews

❤️ Wishlist

🎯 Personalized recommendations

📈 Advanced business reports

🤖 More specialized AI agents

📱 Enhanced mobile experience

🌍 Multi-business support

🏁 FINAL SUMMARY

✨ AURA Marketplace

A full-stack marketplace where customers shop simply, business owners manage intelligently, and AURA AI answers from authorized business information.

AURA demonstrates:

Full-Stack Development • E-Commerce • AI • RAG • Vector Search • Database Design • Authentication • Authorization • Customer Privacy • Business Analytics • Human-in-the-Loop AI • Deployment

<p align="center">

✨ AURA Marketplace ✨

Shop simply. Manage intelligently. Ask AURA.

</p>