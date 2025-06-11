from flask import Flask, request, jsonify
from bot import BotModel 
import torch

app = Flask(__name__)

bot = None

@app.route('/api/initialize', methods=['POST'])
def initialize_bot():
    global bot
    try:
        bot = BotModel()
        return jsonify({"status": "success", "message": "Bot initialized successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    global bot
    
    if bot is None:
        try:
            bot = BotModel()
        except Exception as e:
            return jsonify({"status": "error", "message": f"Failed to initialize bot: {str(e)}"}), 500
    
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"status": "error", "message": "No message provided"}), 400
    
    user_message = data['message']
    
    try:
        response, context = bot.generate_response(user_message)
        
        return jsonify({
            "status": "success",
            "response": response,
            "context": context
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "cuda_available": torch.cuda.is_available()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)