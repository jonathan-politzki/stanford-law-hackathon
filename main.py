import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from document_parser import parse_document
from openai_integration import summarize_differences, generate_suggestion
from diff_utils import compare_texts, identify_linked_edits

app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = '/tmp'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/word-add-in/<path:filename>')
def word_add_in(filename):
    return send_from_directory('static/word-add-in', filename)

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'originalFile' not in request.files or 'revisedFile' not in request.files:
        return jsonify({'error': 'Both original and revised files are required'}), 400
    
    original_file = request.files['originalFile']
    revised_file = request.files['revisedFile']
    
    if original_file.filename == '' or revised_file.filename == '':
        return jsonify({'error': 'Both files must be selected'}), 400
    
    if original_file and revised_file and original_file.filename.lower().endswith('.docx') and revised_file.filename.lower().endswith('.docx'):
        original_filename = secure_filename(original_file.filename)
        revised_filename = secure_filename(revised_file.filename)
        
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        revised_path = os.path.join(app.config['UPLOAD_FOLDER'], revised_filename)
        
        original_file.save(original_path)
        revised_file.save(revised_path)
        
        original_paragraphs = parse_document(original_path)
        revised_paragraphs = parse_document(revised_path)
        
        differences = compare_texts(original_paragraphs, revised_paragraphs)
        linked_edits = identify_linked_edits(differences)
        
        formatted_differences = [
            {
                'type': diff[0],
                'text': diff[1],
                'style': diff[2],
                'indent': diff[3]
            }
            for diff in differences
        ]
        
        formatted_linked_edits = [
            [
                {
                    'index': edit[0],
                    'type': edit[1],
                    'text': edit[2],
                    'style': edit[3],
                    'indent': edit[4]
                }
                for edit in group
            ]
            for group in linked_edits
        ]
        
        summary = summarize_differences(formatted_linked_edits)
        
        return jsonify({
            'original': [p['text'] for p in original_paragraphs],
            'revised': [p['text'] for p in revised_paragraphs],
            'differences': formatted_differences,
            'linked_edits': formatted_linked_edits,
            'summary': summary
        })
    else:
        return jsonify({'error': 'Invalid file type. Please upload .docx files for both original and revised documents.'}), 400

@app.route('/suggest', methods=['POST'])
def suggest_change():
    data = request.json
    suggestion = generate_suggestion(data['context'], data['proposed_change'])
    return jsonify({'suggestion': suggestion})

@app.route('/analyze', methods=['POST'])
def analyze_document():
    data = request.json
    text = data['text']
    
    # Process the text using your existing functions
    paragraphs = [{'text': p.strip()} for p in text.split('\n') if p.strip()]
    differences = compare_texts(paragraphs, paragraphs)  # Compare with itself to identify structure
    linked_edits = identify_linked_edits(differences)
    
    formatted_linked_edits = [
        [
            {
                'index': edit[0],
                'type': edit[1],
                'text': edit[2],
                'style': edit[3] if len(edit) > 3 else None,
                'indent': edit[4] if len(edit) > 4 else None
            }
            for edit in group
        ]
        for group in linked_edits
    ]
    
    summary = summarize_differences(formatted_linked_edits)
    suggestions = generate_suggestion(text, "Improve the document structure and clarity")
    
    return jsonify({
        'summary': summary,
        'suggestions': suggestions.split('\n') if isinstance(suggestions, str) else suggestions
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
