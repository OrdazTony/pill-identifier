from flask import Flask, request, jsonify
import pandas as pd
from google.cloud import vision
from google.api_core.exceptions import GoogleAPIError
from flask_cors import CORS
from pathlib import Path

df = pd.read_csv(Path(__file__).parent / 'Pillbox_-_Archived_Data_20260618.csv')

app = Flask(__name__)
CORS(app) # Enable CORS for all future routes, particularly expo.

def find_pills_by_imprint(imprint: str):
    cleaned = " ".join(imprint.split()).upper() #cleans up and converts to uppercase for consistent search
    matching_rows = df[df["splimprint"] == cleaned] #returns the rows where splimprint matches cleaned(input imprint)

    matches = [] #stores matches
    seen = [] #stores combinations of name, shape, and color to avoid duplicates

    for _, row in matching_rows.iterrows():
        current = [row['medicine_name'], row['splshape_text'], row['splcolor_text']]
        if current not in seen:
            matches.append({
                "name": row["medicine_name"],
                "imprint": cleaned,
                "shape": row["splshape_text"],
                "color": row["splcolor_text"]
            })
            seen.append(current)
    return cleaned, matches

@app.route("/search", methods=["GET"])
def show_search() -> tuple:
    input_value = request.args.get("query", "")
    cleaned, matches = find_pills_by_imprint(input_value)
    if not matches:
        return jsonify ({"error": "No results found."}), 400
    return jsonify({
        "query": cleaned,
        "matches": matches
    }), 200
        #check if search by imprint or search by name. If the input is purely alphabetic, search by name. 
        # if input_value.isalpha():
        #     if df[df['medicine_name'].str.contains(input_value, case=False, na=False, regex=False)].empty:
        #         return jsonify({"error": "No results found."}), 400
        #     else:
        #         pill_name = df[df['medicine_name'].str.contains(input_value, case=False, na=False, regex=False)]['medicine_name'].values[0]

        #         return jsonify({"results": f"The pill with the name '{input_value}' is identified as: {pill_name}."}), 200
        #     # If the input is alphanumeric, search by imprint. 
        # no need to search by name as app functionality focuses on search by imprint. 


        #rewritten version of Search by imprint
    #     matching_rows = df[df["splimprint"] == cleaned]
    #     if not matching_rows.empty:
    #         matches = []
    #         seen = []
    #         for i in range(len(matching_rows)):
    #             current = [matching_rows['medicine_name'].values[i], matching_rows['splshape_text'].values[i], matching_rows['splcolor_text'].values[i]]
    #             if current not in seen:
    #                 matches.append({
    #                 "name": matching_rows['medicine_name'].values[i],
    #                 "imprint": cleaned,
    #                 "shape": matching_rows['splshape_text'].values[i],
    #                 "color": matching_rows['splcolor_text'].values[i]
    #             })
    #                 seen.append(current)
    #         return jsonify({
    #             "query": cleaned,
    #             "matches": matches
    #         }), 200
    #     else:
    #         return jsonify({"error": "No results found."}), 400
    # # If the input is neither, return an error message.
    # return jsonify({"error": "Invalid query."}), 400

def ocr_search(imprint_string):
        cleaned = " ". join(imprint_string.split()).upper() #cleans up and converts to uppercase for conistent search
        if cleaned != "":
            matching_rows = df[df["splimprint"] == cleaned]
            if not matching_rows.empty:
                matches = []
                seen = []
                for i in range(len(matching_rows)):
                    current = [matching_rows['medicine_name'].values[i], matching_rows['splshape_text'].values[i], matching_rows['splcolor_text'].values[i]]
                    if current not in seen:
                        matches.append({
                        "name": matching_rows['medicine_name'].values[i],
                        "imprint": cleaned,
                        "shape": matching_rows['splshape_text'].values[i],
                        "color": matching_rows['splcolor_text'].values[i]
                    })
                        seen.append(current)
                return jsonify({
                    "query": cleaned,
                    "matches": matches
                }), 200
            else:
                return jsonify({"error": "No results found."}), 400
        # If the input is neither, return an error message.
        return jsonify({"error": "Invalid query."}), 400


@app.route("/ocr", methods=["POST"])
def check_ocr():
    if( 'image' not in request.files):
        return jsonify({"error": "No image uploaded."}), 400
    uploaded = request.files['image']
    if (uploaded.filename == ""):
        return jsonify({"error": "Filename not provided."}), 400
    
    image = uploaded.read()
    bytecount = len(image)
    if bytecount == 0:
        return jsonify({"error": "Uploaded image is empty."}), 400
    # Not finished yet. Up to here it simply checks if the image is uploaded and returns the byte count. 
    # Next step is to send the image to Google Vision API for OCR processing.  
    #   
    try: 
        client = vision.ImageAnnotatorClient()
        vision_image = vision.Image(content=image)
        response = client.text_detection(image=vision_image)
    except GoogleAPIError as e:
        return jsonify({"error": str(e)}), 502
    
    #now we start doing checks
    if response.error.message:
        return jsonify({"error": response.error.message}), 502
    if not response.text_annotations:
        return jsonify ({"error": "No text detected in the image."}), 400
    detected_text = response.text_annotations[0].description.strip()
    cleaned, matches = find_pills_by_imprint(detected_text)
    if not matches:
        return jsonify({"error": "No results found."}), 400
    return jsonify({
        "extractedText": detected_text,
        "matches": matches
    }), 200

    # if detected_text:
    #     #now text can be used to search in the database.
    #     search_results = ocr_search(detected_text)
    #     for match in search_results.get_json().get("matches", []):
    #         return jsonify({
    #             "extractedText": search_results.get_json().get("query", ""),
    #             "matches": search_results.get_json().get("matches", [])
    #         }), 200
    #     return jsonify({"error": "No matches found."}), 400

    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)