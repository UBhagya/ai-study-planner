from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "AI Service running 🤖"})


@app.route('/generate-timetable', methods=['POST'])
def generate_timetable():

    data = request.json
    subjects = data.get('subjects', [])
    availability = data.get('availability', [])

    timetable = []

    if not subjects or not availability:
        return jsonify({"timetable": []})

    # Sort subjects by priority (high priority first)
    subjects = sorted(subjects, key=lambda x: x['priority'], reverse=True)

    # Copy availability slots so we can remove used ones
    available_slots = availability.copy()

    for subject in subjects:

        if not available_slots:
            break

        # Take the first available slot
        slot = available_slots.pop(0)

        timetable.append({
            "subject_id": subject['subject_id'],
            "subject_name": subject['subject_name'],
            "day": slot['day_of_week'],
            "start_time": str(slot['start_time'])[:5],
            "end_time": str(slot['end_time'])[:5],
            "priority": subject['priority'],
            "difficulty": subject['difficulty_level']
        })

    return jsonify({"timetable": timetable})


if __name__ == '__main__':
    app.run(port=8000, debug=True)