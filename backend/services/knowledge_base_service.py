import re


# ==========================================
# KNOWLEDGE BASE ARTICLES
# ==========================================

KNOWLEDGE_BASE = [

    {
        "id": 1,
        "title": "Wi-Fi Connection Problems",
        "category": "Network",
        "keywords": [
            "wifi", "wi-fi", "internet",
            "network", "connection"
        ],
        "solution": [
            "Check whether Wi-Fi is enabled on your laptop.",
            "Restart your Wi-Fi router.",
            "Disconnect and reconnect to the Wi-Fi network.",
            "Restart your laptop.",
            "Update your network adapter driver."
        ]
    },

    {
        "id": 2,
        "title": "Laptop Running Slowly",
        "category": "Hardware",
        "keywords": [
            "slow", "laptop", "performance",
            "hang", "freezing"
        ],
        "solution": [
            "Restart your laptop.",
            "Close unnecessary background applications.",
            "Check available disk space.",
            "Disable unnecessary startup applications.",
            "Check Task Manager for high CPU or memory usage."
        ]
    },

    {
        "id": 3,
        "title": "Software Installation Issues",
        "category": "Software",
        "keywords": [
            "software", "install", "installation",
            "application", "app"
        ],
        "solution": [
            "Check whether your system meets the software requirements.",
            "Download the installer from the official website.",
            "Run the installer with administrator permissions.",
            "Check whether antivirus software is blocking installation.",
            "Restart your laptop and try installing again."
        ]
    },

    {
        "id": 4,
        "title": "Password and Login Problems",
        "category": "Security",
        "keywords": [
            "password", "login", "account",
            "locked", "authentication"
        ],
        "solution": [
            "Check whether your username and password are correct.",
            "Verify that Caps Lock is turned off.",
            "Use the password reset option if necessary.",
            "Check whether your account is locked.",
            "Contact IT support if the problem continues."
        ]
    }

]


# ==========================================
# WEIGHTED KEYWORD DICTIONARY
# ==========================================

KEYWORD_WEIGHTS = {

    # Software-related keywords
    "install": 10,
    "installation": 10,
    "software": 8,
    "application": 8,
    "app": 5,

    # Network-related keywords
    "wifi": 10,
    "wi-fi": 10,
    "internet": 9,
    "network": 9,
    "connection": 8,

    # Performance-related keywords
    "slow": 9,
    "performance": 8,
    "hang": 8,
    "freezing": 8,
    "laptop": 1,

    # Account-related keywords
    "password": 10,
    "login": 9,
    "account": 8,
    "authentication": 9,
    "locked": 8,

    # Security-related keywords
    "virus": 10,
    "malware": 10,
    "phishing": 10,
    "hacked": 10
}


# ==========================================
# SEARCH KNOWLEDGE BASE
# USING WEIGHTED KEYWORD MATCHING
# ==========================================

def search_knowledge_base(issue):

    issue = issue.lower().strip()

    highest_score = 0
    best_match = None

    print("\n========== KNOWLEDGE BASE SEARCH ==========", flush=True)
    print("Searching issue:", issue, flush=True)

    # Check every Knowledge Base article
    for article in KNOWLEDGE_BASE:

        score = 0

        for keyword in article["keywords"]:

            # Match complete words
            pattern = r"\b" + re.escape(keyword) + r"\b"

            if re.search(pattern, issue):

                # Get keyword weight
                weight = KEYWORD_WEIGHTS.get(keyword, 3)

                score += weight

                # Debugging information
                print(
                    f"Matched keyword: {keyword} | Weight: {weight}",
                    flush=True
                )

        # Display article score
        print(
            f"Article: {article['title']} | Score: {score}",
            flush=True
        )

        # Select article with highest score
        if score > highest_score:

            highest_score = score
            best_match = article

    print("Highest relevance score:", highest_score, flush=True)

    # No matching article found
    if best_match is None:

        print("No matching article found.", flush=True)

        return {
            "found": False,
            "message": "No relevant knowledge article found."
        }

    print(
        "Best matching article:",
        best_match["title"],
        flush=True
    )

    print("===========================================\n", flush=True)

    # Return best matching article
    return {
        "found": True,
        "title": best_match["title"],
        "category": best_match["category"],
        "solution": best_match["solution"],
        "relevanceScore": highest_score
    }