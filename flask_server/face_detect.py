from flask import Flask, request, jsonify
import cv2 as cv
import dlib
from sklearn.metrics import euclidean_distances
import imutils
import imutils.face_utils
import numpy as np
import matplotlib.pyplot as plt
import json
from werkzeug.utils import secure_filename
import os
import pandas as pd
import requests
from scipy.signal import butter, filtfilt
from scipy.fft import fft, fftfreq
import subprocess

app = Flask(__name__)

def process_filenames(string, directory, filetype):
    filename = string
    filename = filename.replace(directory, '')
    filename = filename.replace(filetype, '')

    return filename


def plot_rgb(rgb_average):

    
    r_values = [value[0] for value in rgb_average]
    g_values = [value[1] for value in rgb_average]
    b_values = [value[2] for value in rgb_average]

    r_x_label = len(r_values)
    g_x_label = len(g_values)
    b_x_label = len(b_values)

    plt.plot(range(0,r_x_label), r_values, label = 'R values', color='red')
    plt.plot(range(0,g_x_label), g_values, label = 'G values', color='green')
    plt.plot(range(0,b_x_label), b_values, label = 'B values', color='blue')
    #plt.xticks(range(0, 330, 10), rotation = 45)

    plt.title('Average RGB per frame')
    plt.xlabel('Frame Number')
    plt.ylabel('R, G, B value')
    plt.legend()

    plt.savefig('flask_server/output/average_rgb_per_frame.png')

class ImageProcessing:

    def __init__(self, image):

        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("flask_server/shape_predictor_81_face_landmarks.dat")

    def crop_face(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        face_cascade = cv.CascadeClassifier('flask_server/cascades/haarcascade_frontalface_default.xml')

        faces = face_cascade.detectMultiScale(gray, 1.25, 6)

        for (x, y, w, h) in faces:
            cv.rectangle(input_image, (x, y), (x+w, int(1.2*y)+h), (0, 0, 255), 2)
            faces = input_image[y:int(1.2*y) + h, x:x + w]
            cv.imwrite('flask_server/processed_image/cropped_output_face.png', faces)  

    def detect_face(self):

        input_image = cv.imread(self.image)
        input_image = imutils.resize(input_image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rectangles = self.detector(gray, 1)

        for (i, rectangle) in enumerate(rectangles):

            shape = self.predictor(gray, rectangle)
            shape = imutils.face_utils.shape_to_np(shape)

            for (x, y) in shape:
                cv.circle(input_image, (x, y), 1, (0, 0, 255), -1)
                cv.imwrite('flask_server/processed_image/landmark_output_face.png', input_image)

class ImageProcessingVid:

    def __init__(self, image):
        self.image = image
            
    def crop_face(self):
        
        input_image = cv.imdecode(self.image, 1)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        face_cascade = cv.CascadeClassifier('flask_server/cascades/haarcascade_frontalface_default.xml')

        faces = face_cascade.detectMultiScale(gray, 1.25, 6)

        for (x, y, w, h) in faces:
            cv.rectangle(input_image, (x, y), (x+w, int(1.2*y)+h), (0, 0, 255), 2)
            faces = input_image[y:int(1.2*y) + h, x:x + w]
            
            return cv.imencode('.jpg', faces)

class ImageAnalysis:

    def __init__(self, image):
        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("flask_server/shape_predictor_81_face_landmarks.dat")

    def extract_facial_regions(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)
        
        facial_landmark_index = {"eyebrows": (17,26),
                                 "nose": (27,35),
                                 "jaw": (2,13)
                                 }

        rects = self.detector(gray, 1)

        for (i, rect) in enumerate(rects):
            
            shape = self.predictor(gray, rect)
            shape = imutils.face_utils.shape_to_np(shape)

            for key, value in facial_landmark_index.items():

                clone = input_image.copy()
                
                for (x, y) in shape[value[0]:value[1]]:
                    
                    cv.circle(clone, (x, y), 1, (0, 0, 255), -1)
                
                    (x, y, w, h) = cv.boundingRect(np.array([shape[value[0]:value[1]]]))
                    roi = input_image[y:y + h, x:x + w]

                    try:
                        roi = imutils.resize(roi, width=250, inter=cv.INTER_CUBIC)
                    except:
                        break

                    cv.imwrite('flask_server/processed_image/' + key + '.png', roi)
        
            cv.imwrite('flask_server/output/image_patch.png', imutils.face_utils.visualize_facial_landmarks(input_image, shape))
 
    def extract_cheeks(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rects = self.detector(gray, 1)

        for (i, rect) in enumerate(rects):
            shape = self.predictor(gray, rect)

            shape = imutils.face_utils.shape_to_np(shape)

            right_cheek = input_image[shape[28][1]:shape[33][1], shape[53][0]:shape[12][0]]
            left_cheek = input_image[shape[28][1]:shape[33][1], shape[4][0]:shape[48][0]]
            cv.imwrite('flask_server/processed_image/right_cheek.png', right_cheek)
            cv.imwrite('flask_server/processed_image/left_cheek.png', left_cheek)

    def extract_forehead(self):

        input_image = cv.imread(self.image)
        y = 0
        x = 0
        h = input_image.shape[0]
        w = input_image.shape[1]

        h = int(h/4) #takes first quarter of picture

        cropped_image = input_image[y:y+h, x:x+w]

        cv.imwrite('flask_server/processed_image/forehead.png', cropped_image)  

class ImageAnalysisVid:

    def __init__(self, image):
        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("flask_server/shape_predictor_81_face_landmarks.dat")
        self.filename = process_filenames(image, 'flask_server/processed_image/', '.jpg')

    def extract_facial_regions(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)
        
        facial_landmark_index = {"eyebrows": (17,26),
                                 "nose": (27,35),
                                 "jaw": (2,13)
                                 }

        rects = self.detector(gray, 1)

        for (i, rect) in enumerate(rects):
            
            shape = self.predictor(gray, rect)
            shape = imutils.face_utils.shape_to_np(shape)

            for key, value in facial_landmark_index.items():

                clone = input_image.copy()
                
                for (x, y) in shape[value[0]:value[1]]:
                    
                    cv.circle(clone, (x, y), 1, (0, 0, 255), -1)
                
                    (x, y, w, h) = cv.boundingRect(np.array([shape[value[0]:value[1]]]))
                    roi = input_image[y:y + h, x:x + w]

                    try:
                        roi = imutils.resize(roi, width=250, inter=cv.INTER_CUBIC)
                    except:
                        break

                    cv.imwrite('flask_server/output/' + key + '-' + self.filename + '.png', roi)
        
            cv.imwrite('flask_server/output/face_patch.png', imutils.face_utils.visualize_facial_landmarks(input_image, shape))

    def extract_cheeks(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rects = self.detector(gray, 1)

        for (i, rect) in enumerate(rects):
            shape = self.predictor(gray, rect)

            shape = imutils.face_utils.shape_to_np(shape)

            right_cheek = input_image[shape[28][1]:shape[33][1], shape[53][0]:shape[12][0]]
            left_cheek = input_image[shape[28][1]:shape[33][1], shape[4][0]:shape[48][0]]

            cv.imwrite('flask_server/output/rightcheek-' + self.filename + '.png', right_cheek)
            cv.imwrite('flask_server/output/leftcheek-' + self.filename + '.png', left_cheek)

    def extract_forehead(self):

        input_image = cv.imread(self.image)
        y = 0
        x = 0
        h = input_image.shape[0]
        w = input_image.shape[1]

        h = int(h/4) #takes first quarter of picture

        cropped_image = input_image[y:y+h, x:x+w]

        cv.imwrite('flask_server/output/forehead-' + self.filename + '.png', cropped_image)

class ExtractLandmarks:

    def __init__(self, image):
        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("flask_server/shape_predictor_81_face_landmarks.dat")

    def extract_landmark_pixel_positions(self):

        input_image = cv.imdecode(self.image, 1)

        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rects = self.detector(gray, 1)

        landmark_pixels = []

        for (i, rect) in enumerate(rects):
            
            shape = self.predictor(gray, rect)
            shape = imutils.face_utils.shape_to_np(shape)

            for (x,y) in shape:

                landmark_pixels.append([x.item(),y.item()])

        return landmark_pixels

class RGBAnalysis:

    def __init__(self, image, pixel_list):
        self.image = image
        self.pixel_list = pixel_list
    
    def rgb_average_from_points(self):
        # Decode the image
        input_image = cv.imdecode(self.image, 1)

        # Convert pixel_list to a numpy array for efficient processing
        pixel_array = np.array(self.pixel_list)

        if pixel_array.size == 0:
            return None

        # Filter out invalid pixel locations
        
        valid_mask = (pixel_array[:, 0] < input_image.shape[1]) & (pixel_array[:, 1] < input_image.shape[0])
        valid_pixels = pixel_array[valid_mask]

        # Extract RGB values using numpy advanced indexing
        if valid_pixels.size == 0:
            return None  # Return None if no valid pixels

        pixel_rgb = input_image[valid_pixels[:, 1], valid_pixels[:, 0]]

        # Compute the average RGB values
        rgb_average = np.mean(pixel_rgb, axis=0)

        # Ensure the output is a numpy array of size 3
        if rgb_average.size == 3:
            return rgb_average

class SkinToneAnalysis:

    def __init__(self, bgr, skin_tone_chart):
        self.bgr = bgr
        self.skin_tone_chart = skin_tone_chart

    # Convert skin tone chart RGB columns to a NumPy array, Compute Euclidean distances, Find the minimum distance index
    def find_closest_skin_tone(self):
        sample_rgb = self.bgr
        sample_rgb[0], sample_rgb[2] = sample_rgb[2], sample_rgb[0]
        skin_tone_chart = pd.read_csv(self.skin_tone_chart)
        colors = skin_tone_chart[['rgb']].apply(lambda x: np.array(eval(x['rgb'])), axis=1).tolist()
        color_names = skin_tone_chart['name'].tolist()
        
        distances = euclidean_distances([sample_rgb], colors)
        
        min_index = np.argmin(distances)
        return color_names[min_index], colors[min_index]
    
def bandpass_filter(signal, lowcut, highcut, fs, order=5):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, signal)

def bandpass_filter2(signal, lowcut, highcut, fs, order=5):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    
    padlen = min(33, len(signal)-1)
    # print(padlen)
    
    return filtfilt(b, a, signal, padlen=padlen)

def hr_calculator(rgb_average):
    fs = 30
    lowcut = 0.7
    highcut = 4.0

    # filtered_rgb = [bandpass_filter(signal, lowcut, highcut, fs) for signal in rgb_average.T]
    filtered_rgb = [bandpass_filter2(signal, lowcut, highcut, fs) for signal in rgb_average.T]

    N = len(filtered_rgb[0])
    frequencies = fftfreq(N, 1/fs)
    fft_values = fft(filtered_rgb[0])

    idx = np.argmax(np.abs(fft_values))
    heart_rate = abs(frequencies[idx] * 60)
    return heart_rate

def convert_webm_to_mp4(input_file_path, output_file_path):
    command = [
        'ffmpeg', '-i', input_file_path,
        '-codec:v', 'libx264', '-preset', 'fast',
        '-crf', '23', '-codec:a', 'aac', '-b:a', '192k',
        output_file_path
    ]
    subprocess.run(command, check=True)

#process media
@app.route('/process-media', methods=['POST'])
def process_media():
    if 'media' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['media']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        filename = secure_filename(file.filename)
        file_extension = os.path.splitext(filename)[1].lower()
        file_path = os.path.join('flask_server/input', filename)
        file.save(file_path)

        if file_extension in ['.jpg', '.jpeg', '.png', '.gif']:
            # Process image
            processor = ImageProcessing(file_path)
            processor.crop_face()
            processor = ImageProcessing('flask_server/processed_image/cropped_output_face.png')
            processor.detect_face()

            image_landmark = ImageAnalysis('flask_server/processed_image/landmark_output_face.png')
            image_landmark.extract_facial_regions()
            image_landmark.extract_forehead()
            image_landmark.extract_cheeks()

            processed_image_path = 'processed_image/cropped_output_face.png'
            return jsonify({'processedImagePath': processed_image_path}), 200

        elif file_extension in ['.mp4', '.webm', '.mov', '.mkv']:
            # Process video
            mp4_path = file_path.replace('.webm', '.mp4')
            convert_webm_to_mp4(file_path, mp4_path)

            vidcap = cv.VideoCapture(mp4_path)
            count = 0

            encode_params = [int(cv.IMWRITE_JPEG_QUALITY), 80]

            cropped_images = []


            while vidcap.isOpened():
                ret, frame = vidcap.read()

                if ret:
                    if count == 0:
                        cv.imwrite('flask_server/image/frame-%d.jpg' % count, frame)

                        image_processing = ImageProcessingVid(cv.imencode('.jpg', cv.imread('flask_server/image/frame-0.jpg', 1))[1])
                        cropped_image_output = cv.imdecode(image_processing.crop_face()[1], 1)
                        cv.imwrite('flask_server/processed_image/cropped-frame-0.jpg', cropped_image_output)

                        facial_regions = ImageAnalysisVid('flask_server/processed_image/cropped-frame-0.jpg')
                        facial_regions.extract_facial_regions()
                        facial_regions.extract_forehead()
                        facial_regions.extract_cheeks()

                    result, encimg = cv.imencode('.jpg', frame, encode_params)

                    image_processing = ImageProcessingVid(encimg)
                    cropped_images.append(image_processing.crop_face())
                    count += 5
                    vidcap.set(cv.CAP_PROP_POS_FRAMES, count)
                    print(count)
                    
                else:
                    vidcap.release()
                    break

            rgb_plot = []

            for face in cropped_images:
                if face is not None:
                    image_landmark = ExtractLandmarks(face[1])
                    average_rgb = RGBAnalysis(face[1], image_landmark.extract_landmark_pixel_positions())
                    rgb_plot.append(average_rgb.rgb_average_from_points())       

            rgb_values = []
            for array in rgb_plot:
                if array is not None:
                    rgb_values.append(np.array(array))

            rgb_values = np.array(rgb_values)

            plot_rgb(rgb_values)

            overall_hr = hr_calculator(rgb_values)

            skin_tone = SkinToneAnalysis(rgb_values[0], 'flask_server/data/skin_tone_colors.csv')
            closest_name, closest_rgb = skin_tone.find_closest_skin_tone()
            
            output_dict = {
                'heart_rate': overall_hr.item(), 
                'face_color': closest_rgb.tolist(),
                'tone_name': closest_name
            }

            with open('flask_server/output/output.json', 'w') as outfile:
                json.dump(output_dict, outfile)

            return jsonify({'success': 'video processed'}), 200
        
        else:
            return jsonify({'error': 'Unsupported media type'}), 400

    except Exception as e:
        app.logger.error(f"Error processing media: {str(e)}")
        return jsonify({'error': str(e)}), 500

    finally:
        # Clean up the temporary files
        if os.path.exists(file_path):
            os.remove(file_path)
        for folder in ['flask_server/input', 'flask_server/image']:
            for file in os.listdir(folder):
                file_path = os.path.join(folder, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)

# sends prompt to vllm server
@app.route('/send-prompt', methods=['POST'])
def send_prompt():
    try:
        with open('flask_server/output/output.json', 'r') as file:
            data = json.load(file)
        heartRate = data.get('heart_rate')
        faceColour = data.get('face_color')
        toneName = data.get('tone_name')

        prompt = f"""
        Prompt: You are an AI system trained to detect the heart rate, skin tone, and health implications 
        of a user’s face to identify the health implications. The detected heart rate is {heartRate}. The detected face 
        colour is {faceColour}. The detected tone is {toneName}. Your task is to identify how a person’s 
        heart rate is related to its health implications, the color of a person’s skin to identify what 
        skin tone the person has, and notice anything that stands out on their face. 
        
        ###Example Output below:
        Heart Rate: 80 bpm
        Face Colour: [216, 184, 159]
        Tone Name: Asian_Dark

        Cheeks: Redness, Acne, Puffiness
        Forehead: Lines/Wrinkles, Redness
        Jaw: Acne, Discoloration, Firmness
        Nose: Redness, Pimples, Size

        Heart Rate:
        Your heart rate appears to be at 80 beats per minute, indicating that you are up to regular health and there are no cardiovascular problems indicated through your heart rate.

        Skin Tone:
        The color of your skin tone indicates that you are an Asian person with a medium skin tone level (A3).

        Health Indicators:
        Cheeks (Redness): Redness in the cheeks implies that you have bad lung health and may possibly have bad allergic reactions.
        Cheeks (Acne): The acne on your cheeks suggests that you have issues with your immune system.
        Cheeks (Puffiness): The puffiness of your cheeks is an indication of low energy levels and fluid retention
        Forehead (Lines/Wrinkles): The lines and wrinkles on your foreheads are an indication of high levels of stress and digestive issues or small intestine issues.
        Forehead (Redness): The redness of your forehead is an indication of liver health issues and high stress levels.
        Jaw (Acne): The acne in your jaw is an indication of hormonal imbalances in your body
        Jaw (Discoloration): The discoloration in your jaw is an indication of issues with your reproductive health organs
        Nose (Redness): The redness of your nose is an indication that you suffer from cardiovascular issues
        Nose (Pimples): The pimples on your nose are an indication that you suffer from digestive or respiratory issues; similarly, you have heart issues

        Emotional Indicators:
        Cheeks (Redness): The redness in your cheeks are an indication of feeling embarrassed or high emotional energy
        Cheeks (Puffiness): The puffiness in your cheeks are an indication of emotional stress
        Forehead (Lines and Wrinkles): The lines and wrinkles of your forehead are an emotional indicator for worry and overthinking
        Jaw (Firmness): The firmness of your jaw are an emotional indicator of willpower and empowerment
        Jaw (Acne): The acne of your jaw are an emotional indicator of stress or hormonal turmoil
        Nose (Size): The size of your nose is an emotional indicator of self-confidence and stability in life
        Nose (Redness): The redness in your nose is an emotional indicator of suppressed anger or embarrassment

        Dermatology:
        Cheeks: Dermatological conditions of the cheeks are often indicators of issues with the respiratory system; smokers have hyperpigmentation or general congestion  
        Forehead:  Dermatological conditions of the forehead indicate that there are issues with the bladder or digestive system. Or, it is also an indication of improper removal of makeup or shampoo
        Jaw: Dermatological conditions of the jaw such as pimples are indications that there are issues with improper makeup removal, dental work, and hormonal changes for women.
        Nose: Dermatological conditions of the nose such as broken capillaries are indicators of heavily squeezing pimples, the result of the environment, or pure genetics
        """

        vllm_response = requests.post('http://link-to-vllm-server', json={
            'prompt': prompt,
            'max_tokens': 500,
            'temperature': 0.7
        }, headers={'Content-Type': 'application/json'})

        vllm_response.raise_for_status()
        result = vllm_response.json()

        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error sending prompt to vLLM server: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=8080)