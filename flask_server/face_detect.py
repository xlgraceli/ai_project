from flask import Flask, request, jsonify
import cv2 as cv
import dlib
import imutils
import imutils.face_utils
import numpy as np

app = Flask(__name__)

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
        if input_image is None:
            raise ValueError(f"Image at path {self.image} could not be loaded.")

        input_image = imutils.resize(input_image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rectangles = self.detector(gray, 1)

        for (i, rectangle) in enumerate(rectangles):

            shape = self.predictor(gray, rectangle)
            shape = imutils.face_utils.shape_to_np(shape)

            for (x, y) in shape:
                cv.circle(input_image, (x, y), 1, (0, 0, 255), -1)
                cv.imwrite('flask_server/processed_image/landmark_output_face.png', input_image)

class ImageAnalysis:

    def __init__(self, image):
        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("shape_predictor_81_face_landmarks.dat")

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

                    cv.imwrite('processed_image/' + key + '.png', roi)
        
            #cv.imwrite('/Users/nathanlo/PycharmProjects/iDC - AI Project/processed_image/' + key + '2.png', imutils.face_utils.visualize_facial_landmarks(input_image, shape))

    def extract_cheeks(self):

        input_image = cv.imread(self.image)
        gray = cv.cvtColor(input_image, cv.COLOR_BGR2GRAY)

        rects = self.detector(gray, 1)

        for (i, rect) in enumerate(rects):
            shape = self.predictor(gray, rect)

            shape = imutils.face_utils.shape_to_np(shape)

            right_cheek = input_image[shape[28][1]:shape[33][1], shape[53][0]:shape[12][0]]
            left_cheek = input_image[shape[28][1]:shape[33][1], shape[4][0]:shape[48][0]]
            cv.imwrite('processed_image/right_cheek.png', right_cheek)
            cv.imwrite('processed_image/left_cheek.png', left_cheek)

    def extract_forehead(self):

        input_image = cv.imread(self.image)
        y = 0
        x = 0
        h = input_image.shape[0]
        w = input_image.shape[1]

        h = int(h/4) #takes first quarter of picture

        cropped_image = input_image[y:y+h, x:x+w]

        cv.imwrite('processed_image/forehead.png', cropped_image)      


class RGBProcessing:

    def __init__(self, image):

        self.image = image
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("shape_predictor_81_face_landmarks.dat")


    def rgb_filter(self):
        #input: cropped face
        #output: average(?) rgb value of face

        input_image = cv.imread(self.image)
        input_image = imutils.resize(input_image, height=500, width=500)
        rgb = cv.cvtColor(input_image, cv.COLOR_BGR2RGB)

        rgb_array = []

        for x in range(0, 500, 1):
            for y in range(0, 500, 1):
                rgb_array.append(rgb[y,x])

        return rgb_array

@app.route('/process-image', methods=['POST'])
def process_image():
    data = request.get_json()
    image_path = data.get('imagePath')

    if not image_path:
        return jsonify({'error': 'No image path provided'}), 400

    try:
        processor = ImageProcessing(image_path)
        processor.crop_face()
        processor = ImageProcessing('flask_server/processed_image/cropped_output_face.png')
        processor.detect_face()
        processed_image_path = 'cropped_output_face.png'

        return jsonify({'processedImagePath': processed_image_path}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# def main():

#     image_processing = ImageProcessing('image/Photo on 2024-07-22 at 10.32 AM.jpg')
#     image_processing.crop_face()
#     image_processing = ImageProcessing('processed_image/cropped_output_face.png')
#     image_processing.detect_face()

#     image_landmark = ImageAnalysis('processed_image/landmark_output_face.png')
#     image_landmark.extract_facial_regions()
#     image_landmark.extract_forehead()
#     image_landmark.extract_cheeks()
    
#     rgb_output = RGBProcessing('processed_image/landmark_output_face.png')
#     #print(rgb_output.rgb_filter())


if __name__ == '__main__':
    app.run(port=5001)