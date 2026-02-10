"""
2D Blueprint to 3D BIM Converter
Converts 2D architectural blueprint images to 3D Building Information Models
for construction planning and visualization.
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import json
import os
import sys
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Optional
from scipy import ndimage


@dataclass
class Wall:
    """Represents a wall in the building model"""
    start_point: Tuple[float, float]
    end_point: Tuple[float, float]
    thickness: float = 0.2  # meters
    height: float = 3.0     # meters
    
@dataclass
class Room:
    """Represents a room with its boundaries"""
    name: str
    corners: List[Tuple[float, float]]
    area: float

@dataclass
class Door:
    """Represents a door opening"""
    position: Tuple[float, float]
    width: float = 0.9  # Standard door width in meters
    wall_index: int = -1
    

@dataclass
class Window:
    """Represents a window opening"""
    position: Tuple[float, float]
    width: float = 1.2
    height: float = 1.5
    wall_index: int = -1
    
@dataclass
class BIMModel:
    """Building Information Model container"""
    walls: List[Wall]
    rooms: List[Room]
    doors: List[Door] = None
    windows: List[Window] = None
    floors: int = 1
    floor_height: float = 3.0
    metadata: Dict = None


class BlueprintTo3DBIM:
    """Converts 2D blueprint images to 3D BIM models"""
    
    def __init__(self, scale_factor: float = 0.05):
        """
        Initialize converter
        
        Args:
            scale_factor: Conversion from pixels to meters (e.g., 0.05 = 1 pixel = 5cm)
        """
        self.scale_factor = scale_factor
        self.walls = []
        self.rooms = []
        
    def load_blueprint(self, image_path: str) -> np.ndarray:
        """Load and preprocess blueprint image"""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        return img
    
    def preprocess_image(self, img: np.ndarray) -> np.ndarray:
        """Preprocess blueprint image for wall detection"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to reduce noise while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Apply adaptive thresholding
        binary = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Morphological operations to clean up
        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        return binary
    
    def detect_walls(self, binary_img: np.ndarray) -> List[Wall]:
        """Detect walls from preprocessed binary image using line detection"""
        # Use Hough Line Transform to detect straight lines
        edges = cv2.Canny(binary_img, 50, 150, apertureSize=3)
        
        # Detect lines using probabilistic Hough transform
        lines = cv2.HoughLinesP(
            edges, 
            rho=1, 
            theta=np.pi/180, 
            threshold=100,
            minLineLength=50,
            maxLineGap=10
        )
        
        walls = []
        if lines is not None:
            # Filter and merge nearby parallel lines
            merged_lines = self._merge_parallel_lines(lines)
            
            for line in merged_lines:
                x1, y1, x2, y2 = line
                
                # Convert to meters
                start = (x1 * self.scale_factor, y1 * self.scale_factor)
                end = (x2 * self.scale_factor, y2 * self.scale_factor)
                
                # Estimate wall thickness based on nearby parallel lines
                thickness = 0.2  # Default 20cm
                
                wall = Wall(start_point=start, end_point=end, thickness=thickness)
                walls.append(wall)
        
        self.walls = walls
        return walls
    
    def _merge_parallel_lines(self, lines: np.ndarray, 
                             angle_threshold: float = 5.0,
                             distance_threshold: float = 10.0) -> List:
        """Merge nearby parallel lines to reduce duplicates"""
        if lines is None or len(lines) == 0:
            return []
        
        lines = lines.reshape(-1, 4)
        merged = []
        used = set()
        
        for i, line1 in enumerate(lines):
            if i in used:
                continue
                
            x1, y1, x2, y2 = line1
            angle1 = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            
            # Find parallel lines
            similar_lines = [line1]
            for j, line2 in enumerate(lines[i+1:], start=i+1):
                if j in used:
                    continue
                    
                x3, y3, x4, y4 = line2
                angle2 = np.arctan2(y4 - y3, x4 - x3) * 180 / np.pi
                
                # Check if angles are similar
                angle_diff = abs(angle1 - angle2)
                if angle_diff > 180:
                    angle_diff = 360 - angle_diff
                    
                if angle_diff < angle_threshold:
                    # Check distance between lines
                    dist = self._point_to_line_distance((x3, y3), (x1, y1, x2, y2))
                    if dist < distance_threshold:
                        similar_lines.append(line2)
                        used.add(j)
            
            # Merge similar lines
            if len(similar_lines) > 1:
                all_points = [(x, y) for line in similar_lines 
                             for x, y in [(line[0], line[1]), (line[2], line[3])]]
                # Find extreme points
                x_coords = [p[0] for p in all_points]
                y_coords = [p[1] for p in all_points]
                # Extract coordinates from list and format as [x1, y1, x2, y2]
                merged_line = [min(x_coords), min(y_coords), max(x_coords), max(y_coords)]
            else:
                merged_line = line1.tolist()
                
            merged.append(merged_line)
            used.add(i)
        
        return merged
    
    def _point_to_line_distance(self, point: Tuple, line: Tuple) -> float:
        """Calculate perpendicular distance from point to line"""
        x0, y0 = point
        x1, y1, x2, y2 = line
        
        num = abs((y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1)
        den = np.sqrt((y2-y1)**2 + (x2-x1)**2)
        
        return num / den if den != 0 else float('inf')
    
    def detect_rooms(self, binary_img: np.ndarray) -> List[Room]:
        """Detect rooms using contour detection"""
        # Find contours
        contours, _ = cv2.findContours(
            binary_img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )
        
        rooms = []
        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            
            # Filter small areas (noise) and very large areas (entire image)
            if area > 1000 and area < binary_img.size * 0.8:
                # Approximate contour to polygon
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Convert to list of corner points in meters
                corners = [(float(pt[0][0] * self.scale_factor), 
                           float(pt[0][1] * self.scale_factor)) 
                          for pt in approx]
                
                room = Room(
                    name=f"Room_{idx}",
                    corners=corners,
                    area=float(area * (self.scale_factor ** 2))
                )
                rooms.append(room)
        
        self.rooms = rooms
        return rooms
    
    def create_3d_model(self, floor_height: float = 3.0, 
                       num_floors: int = 1) -> BIMModel:
        """Create 3D BIM model from detected walls and rooms"""
        bim_model = BIMModel(
            walls=self.walls,
            rooms=self.rooms,
            floors=num_floors,
            floor_height=floor_height,
            metadata={
                'total_wall_length': round(sum(self._calculate_wall_length(w) for w in self.walls), 2),
                'total_floor_area': round(sum(r.area for r in self.rooms), 2),
                'scale_factor': self.scale_factor
            }
        )
        return bim_model
    
    def _calculate_wall_length(self, wall: Wall) -> float:
        """Calculate wall length in meters"""
        x1, y1 = wall.start_point
        x2, y2 = wall.end_point
        return np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    def visualize_3d(self, bim_model: BIMModel, save_path: str = None):
        """Visualize the 3D BIM model"""
        fig = plt.figure(figsize=(15, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        # Draw walls
        for wall in bim_model.walls:
            self._draw_wall_3d(ax, wall, bim_model.floor_height)
        
        # Draw floors
        self._draw_floors_3d(ax, bim_model)
        
        # Set labels and limits
        ax.set_xlabel('X (meters)')
        ax.set_ylabel('Y (meters)')
        ax.set_zlabel('Z (meters)')
        ax.set_title('3D BIM Model - Building View')
        
        # Set aspect ratio
        if bim_model.walls:
            max_range = max([
                max(w.start_point[0], w.end_point[0]) for w in bim_model.walls
            ] + [max(w.start_point[1], w.end_point[1]) for w in bim_model.walls])
        else:
            max_range = 10
        
        ax.set_xlim([0, max_range])
        ax.set_ylim([0, max_range])
        ax.set_zlim([0, bim_model.floor_height * bim_model.floors])
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"3D visualization saved to {save_path}")
        
        plt.show()
    
    def _draw_wall_3d(self, ax: Axes3D, wall: Wall, height: float):
        """Draw a single wall in 3D"""
        x1, y1 = wall.start_point
        x2, y2 = wall.end_point
        t = wall.thickness / 2
        
        # Calculate perpendicular direction for wall thickness
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        if length == 0:
            return
            
        dx = -(y2 - y1) / length * t
        dy = (x2 - x1) / length * t
        
        # Define 8 vertices of the wall (rectangular prism)
        vertices = [
            [x1 + dx, y1 + dy, 0],
            [x2 + dx, y2 + dy, 0],
            [x2 - dx, y2 - dy, 0],
            [x1 - dx, y1 - dy, 0],
            [x1 + dx, y1 + dy, height],
            [x2 + dx, y2 + dy, height],
            [x2 - dx, y2 - dy, height],
            [x1 - dx, y1 - dy, height],
        ]
        
        # Define the 6 faces of the wall
        faces = [
            [vertices[0], vertices[1], vertices[5], vertices[4]],  # Front
            [vertices[2], vertices[3], vertices[7], vertices[6]],  # Back
            [vertices[0], vertices[3], vertices[7], vertices[4]],  # Left
            [vertices[1], vertices[2], vertices[6], vertices[5]],  # Right
            [vertices[0], vertices[1], vertices[2], vertices[3]],  # Bottom
            [vertices[4], vertices[5], vertices[6], vertices[7]],  # Top
        ]
        
        # Create 3D polygon collection
        poly = Poly3DCollection(faces, alpha=0.7, facecolor='lightgray', 
                               edgecolor='black', linewidths=0.5)
        ax.add_collection3d(poly)
    
    def _draw_floors_3d(self, ax: Axes3D, bim_model: BIMModel):
        """Draw floor slabs"""
        if not bim_model.rooms:
            return
            
        for floor_num in range(bim_model.floors + 1):
            z = floor_num * bim_model.floor_height
            
            for room in bim_model.rooms:
                if len(room.corners) < 3:
                    continue
                    
                # Create floor polygon
                vertices = [[x, y, z] for x, y in room.corners]
                floor_poly = [vertices]
                
                poly = Poly3DCollection(floor_poly, alpha=0.3, 
                                       facecolor='tan' if floor_num % 2 == 0 else 'wheat',
                                       edgecolor='brown', linewidths=0.5)
                ax.add_collection3d(poly)
    
    def export_to_json(self, bim_model: BIMModel, output_path: str):
        """Export BIM model to JSON format"""
        data = asdict(bim_model)
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"BIM model exported to {output_path}")


class AdvancedBlueprintProcessor(BlueprintTo3DBIM):
    """Advanced blueprint processing with additional BIM elements"""
    
    def __init__(self, scale_factor: float = 0.05):
        super().__init__(scale_factor)
        self.doors = []
        self.windows = []
        
    def load_and_enhance(self, image_path: str) -> np.ndarray:
        """Load blueprint and apply enhancement techniques"""
        img = self.load_blueprint(image_path)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    def detect_text_annotations(self, img: np.ndarray) -> List[Dict]:
        """Detect and extract text annotations from blueprint"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Use MSER (Maximally Stable Extremal Regions) for text detection
        mser = cv2.MSER_create()
        regions, _ = mser.detectRegions(gray)
        
        text_regions = []
        for region in regions:
            x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
            
            # Filter by aspect ratio and size (typical for text)
            aspect_ratio = w / float(h) if h > 0 else 0
            if 0.2 < aspect_ratio < 5 and 10 < w < 200 and 10 < h < 100:
                text_regions.append({
                    'bbox': (int(x), int(y), int(w), int(h)),
                    'position': (float(x * self.scale_factor), float(y * self.scale_factor))
                })
        
        return text_regions
    
    def detect_doors(self, binary_img: np.ndarray, walls: List) -> List[Door]:
        """Detect door symbols in blueprint"""
        doors = []
        
        # Create a kernel for door arc detection
        kernel_size = 20
        door_kernel = self._create_arc_kernel(kernel_size)
        
        # Template matching for door arcs
        result = cv2.matchTemplate(binary_img, door_kernel, cv2.TM_CCOEFF_NORMED)
        threshold = 0.6
        locations = np.where(result >= threshold)
        
        for pt in zip(*locations[::-1]):
            x, y = pt
            door = Door(
                position=(float(x * self.scale_factor), float(y * self.scale_factor)),
                width=0.9
            )
            doors.append(door)
        
        self.doors = self._remove_duplicate_doors(doors)
        return self.doors
    
    def _create_arc_kernel(self, size: int) -> np.ndarray:
        """Create a kernel representing a door arc"""
        kernel = np.zeros((size, size), dtype=np.uint8)
        center = size // 2
        radius = size // 2 - 2
        
        # Draw a quarter circle (door swing arc)
        for angle in range(0, 90, 5):
            rad = np.deg2rad(angle)
            x = int(center + radius * np.cos(rad))
            y = int(center + radius * np.sin(rad))
            cv2.circle(kernel, (x, y), 1, 255, -1)
        
        return kernel
    
    def _remove_duplicate_doors(self, doors: List[Door], 
                                min_distance: float = 1.0) -> List[Door]:
        """Remove duplicate door detections"""
        if not doors:
            return []
        
        unique_doors = []
        for door in doors:
            is_duplicate = False
            for unique_door in unique_doors:
                dist = np.sqrt(
                    (door.position[0] - unique_door.position[0])**2 +
                    (door.position[1] - unique_door.position[1])**2
                )
                if dist < min_distance:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_doors.append(door)
        
        return unique_doors
    
    def detect_windows(self, binary_img: np.ndarray) -> List[Window]:
        """Detect window symbols in blueprint"""
        windows = []
        
        # Windows often appear as parallel lines with specific spacing
        kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 2))
        kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 20))
        
        # Detect horizontal and vertical window lines
        horizontal = cv2.morphologyEx(binary_img, cv2.MORPH_OPEN, kernel_h)
        vertical = cv2.morphologyEx(binary_img, cv2.MORPH_OPEN, kernel_v)
        
        # Find contours of potential windows
        contours_h, _ = cv2.findContours(horizontal, cv2.RETR_EXTERNAL, 
                                         cv2.CHAIN_APPROX_SIMPLE)
        contours_v, _ = cv2.findContours(vertical, cv2.RETR_EXTERNAL, 
                                         cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours_h + contours_v:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by size (typical window dimensions)
            if 30 < w < 200 and 10 < h < 50:
                window = Window(
                    position=(float(x * self.scale_factor), float(y * self.scale_factor)),
                    width=float(w * self.scale_factor),
                    height=float(h * self.scale_factor)
                )
                windows.append(window)
        
        self.windows = windows
        return windows
    
    def calculate_room_metrics(self, rooms: List) -> Dict:
        """Calculate detailed metrics for each room"""
        metrics = {}
        
        for idx, room in enumerate(rooms):
            # Calculate perimeter
            perimeter = 0
            corners = room.corners
            for i in range(len(corners)):
                p1 = corners[i]
                p2 = corners[(i + 1) % len(corners)]
                perimeter += np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
            
            # Calculate centroid
            centroid_x = np.mean([p[0] for p in corners])
            centroid_y = np.mean([p[1] for p in corners])
            
            metrics[room.name] = {
                'area': round(float(room.area), 2),
                'perimeter': round(float(perimeter), 2),
                'centroid': (float(centroid_x), float(centroid_y)),
                'num_corners': len(corners)
            }
        
        return metrics
    
    def estimate_material_quantities(self, bim_model) -> Dict:
        """Estimate construction material quantities"""
        quantities = {
            'concrete': {},
            'walls': {},
            'flooring': {},
            'doors': {},
            'windows': {}
        }
        
        # Floor slab concrete
        total_floor_area = sum(r.area for r in bim_model.rooms)
        slab_thickness = 0.15  # 15cm standard slab
        quantities['concrete']['floor_slab_m3'] = round(total_floor_area * slab_thickness, 2)
        
        # Wall materials
        total_wall_area = 0
        for wall in bim_model.walls:
            length = np.sqrt(
                (wall.end_point[0] - wall.start_point[0])**2 +
                (wall.end_point[1] - wall.start_point[1])**2
            )
            wall_area = length * bim_model.floor_height
            total_wall_area += wall_area
        
        quantities['walls']['total_area_m2'] = round(total_wall_area, 2)
        quantities['walls']['bricks_count'] = int(total_wall_area * 80) # ~80 bricks per m2
        
        # Flooring
        quantities['flooring']['tiles_m2'] = round(total_floor_area * 1.1, 2) # 10% waste
        
        # Doors and windows
        quantities['doors']['count'] = len(self.doors)
        quantities['windows']['count'] = len(self.windows)
        
        return quantities
    
    def generate_construction_report(self, bim_model, save_path: str = 'construction_report.txt'):
        """Generate a detailed construction planning report"""
        report = []
        report.append("=" * 60)
        report.append("CONSTRUCTION PLANNING REPORT")
        report.append("=" * 60)
        report.append("")
        
        # Building overview
        report.append("BUILDING OVERVIEW")
        report.append("-" * 60)
        report.append(f"Number of floors: {bim_model.floors}")
        report.append(f"Floor height: {bim_model.floor_height} m")
        report.append(f"Total floor area: {bim_model.metadata['total_floor_area']:.2f} m²")
        report.append(f"Total wall length: {bim_model.metadata['total_wall_length']:.2f} m")
        report.append("")
        
        # Room details
        report.append("ROOM DETAILS")
        report.append("-" * 60)
        room_metrics = self.calculate_room_metrics(bim_model.rooms)
        for room_name, metrics in room_metrics.items():
            report.append(f"\n{room_name}:")
            report.append(f"  Area: {metrics['area']:.2f} m²")
            report.append(f"  Perimeter: {metrics['perimeter']:.2f} m")
            report.append(f"  Corners: {metrics['num_corners']}")
        report.append("")
        
        # Material quantities
        report.append("ESTIMATED MATERIAL QUANTITIES")
        report.append("-" * 60)
        quantities = self.estimate_material_quantities(bim_model)
        
        report.append(f"\nConcrete:")
        report.append(f"  Floor slabs: {quantities['concrete']['floor_slab_m3']:.2f} m³")
        
        report.append(f"\nWalls:")
        report.append(f"  Total wall area: {quantities['walls']['total_area_m2']:.2f} m²")
        report.append(f"  Estimated bricks: {quantities['walls']['bricks_count']:,}")
        
        report.append(f"\nFlooring:")
        report.append(f"  Tiles required: {quantities['flooring']['tiles_m2']:.2f} m²")
        
        report.append(f"\nDoors and Windows:")
        report.append(f"  Doors: {quantities['doors']['count']}")
        report.append(f"  Windows: {quantities['windows']['count']}")
        report.append("")
        
        # Save report
        report_text = "\n".join(report)
        with open(save_path, 'w') as f:
            f.write(report_text)
        
        return report_text


def create_sample_blueprint():
    """Create a sample blueprint image for testing"""
    img = np.ones((800, 1000, 3), dtype=np.uint8) * 255
    
    # Draw outer walls
    cv2.rectangle(img, (50, 50), (950, 750), (0, 0, 0), 8)
    
    # Draw interior walls
    cv2.line(img, (50, 400), (950, 400), (0, 0, 0), 6)  # Horizontal
    cv2.line(img, (500, 400), (500, 750), (0, 0, 0), 6)  # Vertical
    
    # Draw door openings (gaps in walls)
    cv2.rectangle(img, (480, 395), (520, 405), (255, 255, 255), -1)
    
    # Draw window symbols (double lines)
    cv2.line(img, (200, 48), (300, 48), (0, 0, 0), 3)
    cv2.line(img, (200, 52), (300, 52), (0, 0, 0), 3)
    
    # Add room labels
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, 'Living Room', (100, 250), font, 1, (0, 0, 0), 2)
    cv2.putText(img, 'Kitchen', (100, 600), font, 1, (0, 0, 0), 2)
    cv2.putText(img, 'Bedroom', (600, 600), font, 1, (0, 0, 0), 2)
    
    sample_path = 'sample_blueprint.png'
    cv2.imwrite(sample_path, img)
    return sample_path


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI usage for integration: python script.py <input_img> <output_json>
        image_path = sys.argv[1]
        output_path = sys.argv[2] if len(sys.argv) > 2 else 'output.json'
        
        processor = AdvancedBlueprintProcessor(scale_factor=0.05)
        try:
            img = processor.load_blueprint(image_path)
            enhanced = processor.load_and_enhance(image_path)
            binary = processor.preprocess_image(enhanced)
            
            walls = processor.detect_walls(binary)
            rooms = processor.detect_rooms(binary)
            doors = processor.detect_doors(binary, walls)
            windows = processor.detect_windows(binary)
            
            bim_model = processor.create_3d_model()
            bim_model.doors = doors
            bim_model.windows = windows
            
            # Calculate additional metadata
            metrics = processor.calculate_room_metrics(rooms)
            quantities = processor.estimate_material_quantities(bim_model)
            bim_model.metadata.update({
                'room_metrics': metrics,
                'material_quantities': quantities
            })
            
            processor.export_to_json(bim_model, output_path)
            print(f"BIM processing complete: {output_path}")
        except Exception as e:
            print(f"Error during BIM processing: {str(e)}")
            sys.exit(1)
    else:
        # Interactive/Demo mode
        print("Advanced Blueprint to 3D BIM Converter Demo")
        img_path = create_sample_blueprint()
        print(f"Created sample blueprint at {img_path}")
        
        processor = AdvancedBlueprintProcessor(scale_factor=0.05)
        img = processor.load_blueprint(img_path)
        binary_img = processor.preprocess_image(img)
        
        walls = processor.detect_walls(binary_img)
        rooms = processor.detect_rooms(binary_img)
        doors = processor.detect_doors(binary_img, walls)
        windows = processor.detect_windows(binary_img)
        
        print(f"Detected {len(walls)} walls, {len(rooms)} rooms, {len(doors)} doors, {len(windows)} windows")
        
        bim_model = processor.create_3d_model(floor_height=3.0, num_floors=1)
        bim_model.doors = doors
        bim_model.windows = windows
        
        processor.generate_construction_report(bim_model, 'demo_report.txt')
        processor.export_to_json(bim_model, 'demo_model.json')
        # visualize_3d is available but usually requires UI environment
        # processor.visualize_3d(bim_model, save_path='demo_preview.png')
