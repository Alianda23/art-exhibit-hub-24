import os
import json
import base64
import uuid
from datetime import datetime
from decimal import Decimal
from database import get_db_connection, json_dumps

def get_artwork(artwork_id):
    """Get a specific artwork by ID"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Debug the artwork ID being used
        print(f"Attempting to fetch artwork with ID: {artwork_id}")
        
        query = """
        SELECT id, title, artist, description, price, image_url, 
               dimensions, medium, year, status, artist_id
        FROM artworks
        WHERE id = %s
        """
        cursor.execute(query, (artwork_id,))
        row = cursor.fetchone()
        
        if not row:
            print(f"No artwork found with ID: {artwork_id}")
            return {"error": "Artwork not found"}
        
        # Convert the row to a dictionary
        column_names = [col[0] for col in cursor.description]
        artwork = dict(zip(column_names, row))
        
        # Convert id to string to match frontend expectations
        artwork['id'] = str(artwork['id'])
        
        # Ensure artist_id is included in the result
        if 'artist_id' not in artwork or artwork['artist_id'] is None:
            print("Warning: artwork has no artist_id")
        else:
            print(f"Artwork belongs to artist_id: {artwork['artist_id']}")
        
        # Format image URL if needed
        if artwork['image_url']:
            # Handle base64 images
            if artwork['image_url'].startswith('data:') or artwork['image_url'].startswith('base64,'):
                # Save the base64 image to a file and get the file path
                saved_path = save_image_from_base64(artwork['image_url'])
                if saved_path:
                    # Update the database with the new path
                    update_artwork_image(artwork['id'], saved_path)
                    artwork['image_url'] = saved_path
                    print(f"Converted base64 image to file: {saved_path}")
            elif not artwork['image_url'].startswith('/static/'):
                artwork['image_url'] = f"/static/uploads/{os.path.basename(artwork['image_url'])}"
        
        print(f"Successfully retrieved artwork: {artwork}")
        return {"artwork": artwork}
    except Exception as e:
        print(f"Error getting artwork: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_artworks():
    """Get all artworks"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT id, title, artist, description, price, image_url, 
               dimensions, medium, year, status, artist_id
        FROM artworks
        ORDER BY id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        
        artworks = []
        for row in rows:
            # Convert each row to a dictionary
            column_names = [col[0] for col in cursor.description]
            artwork = dict(zip(column_names, row))
            
            # Convert id to string to match frontend expectations
            artwork['id'] = str(artwork['id'])
            
            # Format image URL if needed
            if artwork['image_url'] and not artwork['image_url'].startswith('/static/'):
                artwork['image_url'] = f"/static/uploads/{os.path.basename(artwork['image_url'])}"
            
            artworks.append(artwork)
        
        print(f"Retrieved {len(artworks)} artworks")
        return {"artworks": artworks}
    except Exception as e:
        print(f"Error getting artworks: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def create_artwork(auth_header, artwork_data):
    """Create a new artwork"""
    # First, verify the auth token and extract user info
    from middleware import extract_auth_token, verify_token
    import os
    from database import get_db_connection
    
    token = extract_auth_token(auth_header)
    if not token:
        return {"error": "Authentication required"}
    
    payload = verify_token(token)
    if isinstance(payload, dict) and "error" in payload:
        return {"error": payload["error"]}
    
    # Check if user is admin or artist
    is_admin = payload.get("is_admin", False)
    is_artist = payload.get("is_artist", False)
    
    if not (is_admin or is_artist):
        return {"error": "Unauthorized: Admin or artist privileges required"}
    
    # Get database connection
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Extract artist_id from token if the user is an artist
        artist_id = None
        if is_artist:
            artist_id = payload.get("sub")  # The subject ID from the token is the user/artist ID
        elif "artist_id" in artwork_data:
            artist_id = artwork_data["artist_id"]
        
        # Check required fields
        required_fields = ['title', 'price']
        for field in required_fields:
            if field not in artwork_data or not artwork_data[field]:
                return {"error": f"Missing required field: {field}"}
        
        # Handle image upload if provided
        image_url = None
        if "image" in artwork_data and artwork_data["image"]:
            from utils import save_image_from_base64
            image_data = artwork_data["image"]
            image_url = save_image_from_base64(image_data)
        
        # Insert the new artwork
        query = """
        INSERT INTO artworks (
            title, artist, description, price, image_url, 
            dimensions, medium, year, status, artist_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Get values from the artwork data, with defaults for missing fields
        title = artwork_data.get('title', '')
        artist_name = artwork_data.get('artist', '')
        description = artwork_data.get('description', '')
        price = artwork_data.get('price', 0)
        dimensions = artwork_data.get('dimensions', '')
        medium = artwork_data.get('medium', '')
        year = artwork_data.get('year', '')
        status = artwork_data.get('status', 'available')
        
        # Execute the query
        cursor.execute(query, (
            title, artist_name, description, price, image_url,
            dimensions, medium, year, status, artist_id
        ))
        
        # Commit the changes
        connection.commit()
        
        # Get the ID of the newly inserted artwork
        artwork_id = cursor.lastrowid
        
        print(f"Created new artwork with ID: {artwork_id}")
        return {"success": True, "artwork_id": artwork_id}
    
    except Exception as e:
        print(f"Error creating artwork: {e}")
        return {"error": str(e)}
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def update_artwork(auth_header, artwork_id, artwork_data):
    """Update an existing artwork"""
    # First, verify the auth token and extract user info
    from middleware import extract_auth_token, verify_token
    import os
    from database import get_db_connection
    
    token = extract_auth_token(auth_header)
    if not token:
        return {"error": "Authentication required"}
    
    payload = verify_token(token)
    if isinstance(payload, dict) and "error" in payload:
        return {"error": payload["error"]}
    
    # Check if user is admin or artist
    is_admin = payload.get("is_admin", False)
    is_artist = payload.get("is_artist", False)
    artist_id = payload.get("sub")
    
    if not (is_admin or is_artist):
        return {"error": "Unauthorized: Admin or artist privileges required"}
    
    # Get database connection
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Check if the artwork exists and get its current data
        cursor.execute("SELECT * FROM artworks WHERE id = %s", (artwork_id,))
        existing_artwork = cursor.fetchone()
        
        if not existing_artwork:
            return {"error": f"Artwork with ID {artwork_id} not found"}
        
        # If user is artist, check if they own this artwork
        if is_artist and not is_admin:
            column_names = [col[0] for col in cursor.description]
            artwork_dict = dict(zip(column_names, existing_artwork))
            
            if str(artwork_dict.get('artist_id')) != str(artist_id):
                return {"error": "Unauthorized: You can only update your own artworks"}
        
        # Handle image update if provided
        image_url = None
        if "image" in artwork_data and artwork_data["image"]:
            from utils import save_image_from_base64
            image_data = artwork_data["image"]
            
            # Check if it's a base64 image
            if image_data.startswith('data:') or image_data.startswith('base64,'):
                image_url = save_image_from_base64(image_data)
        
        # Build the update query dynamically based on provided fields
        update_fields = []
        values = []
        
        # Map of field names to database column names
        field_map = {
            'title': 'title',
            'artist': 'artist',
            'description': 'description',
            'price': 'price',
            'dimensions': 'dimensions',
            'medium': 'medium',
            'year': 'year',
            'status': 'status'
        }
        
        # Add fields to update
        for field, db_field in field_map.items():
            if field in artwork_data:
                update_fields.append(f"{db_field} = %s")
                values.append(artwork_data[field])
        
        # Add image_url if it was updated
        if image_url:
            update_fields.append("image_url = %s")
            values.append(image_url)
        
        # If no fields were provided to update, return an error
        if not update_fields:
            return {"error": "No fields provided for update"}
        
        # Complete the query with values and artwork ID
        query = f"""
        UPDATE artworks 
        SET {", ".join(update_fields)}
        WHERE id = %s
        """
        values.append(artwork_id)
        
        # Execute the update
        cursor.execute(query, values)
        connection.commit()
        
        if cursor.rowcount == 0:
            return {"error": "No changes were made to the artwork"}
        
        print(f"Updated artwork with ID: {artwork_id}")
        return {"success": True, "artwork_id": artwork_id}
    
    except Exception as e:
        print(f"Error updating artwork: {e}")
        return {"error": str(e)}
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def delete_artwork(auth_header, artwork_id):
    """Delete an artwork"""
    # First, verify the auth token and extract user info
    from middleware import extract_auth_token, verify_token
    import os
    from database import get_db_connection
    
    token = extract_auth_token(auth_header)
    if not token:
        return {"error": "Authentication required"}
    
    payload = verify_token(token)
    if isinstance(payload, dict) and "error" in payload:
        return {"error": payload["error"]}
    
    # Check if user is admin or artist
    is_admin = payload.get("is_admin", False)
    is_artist = payload.get("is_artist", False)
    artist_id = payload.get("sub")
    
    if not (is_admin or is_artist):
        return {"error": "Unauthorized: Admin or artist privileges required"}
    
    # Get database connection
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Check if the artwork exists and get its current data
        cursor.execute("SELECT * FROM artworks WHERE id = %s", (artwork_id,))
        existing_artwork = cursor.fetchone()
        
        if not existing_artwork:
            return {"error": f"Artwork with ID {artwork_id} not found"}
        
        # If user is artist, check if they own this artwork
        if is_artist and not is_admin:
            column_names = [col[0] for col in cursor.description]
            artwork_dict = dict(zip(column_names, existing_artwork))
            
            if str(artwork_dict.get('artist_id')) != str(artist_id):
                return {"error": "Unauthorized: You can only delete your own artworks"}
        
        # Delete the artwork
        cursor.execute("DELETE FROM artworks WHERE id = %s", (artwork_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            return {"error": "Failed to delete the artwork"}
        
        # If there was an image, we could delete the file here
        # But we'll leave it for now as it might be used elsewhere
        
        print(f"Deleted artwork with ID: {artwork_id}")
        return {"success": True, "message": "Artwork deleted successfully"}
    
    except Exception as e:
        print(f"Error deleting artwork: {e}")
        return {"error": str(e)}
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# Helper function to save base64 image and update artwork image URL
def save_image_from_base64(base64_data):
    """Save base64 image data to a file and return the file path"""
    import os
    import base64
    import uuid
    from datetime import datetime
    
    try:
        # Check if the data is actually base64
        if not base64_data.startswith('data:'):
            return None
        
        # Extract the actual base64 data
        image_format = 'jpg'  # Default format
        if 'data:image/' in base64_data:
            header, base64_data = base64_data.split(',', 1)
            image_format = header.split('data:image/')[1].split(';')[0]
        
        # Decode the base64 data
        image_data = base64.b64decode(base64_data)
        
        # Generate a unique filename
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"artwork_{timestamp}_{unique_id}.{image_format}"
        
        # Ensure the uploads directory exists
        uploads_dir = os.path.join(os.path.dirname(__file__), "static", "uploads")
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
        
        # Save the file
        file_path = os.path.join(uploads_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        # Return the relative path for serving
        return f"/static/uploads/{filename}"
    
    except Exception as e:
        print(f"Error saving base64 image: {e}")
        return None

def update_artwork_image(artwork_id, image_path):
    """Update the image path for an artwork"""
    import os
    from database import get_db_connection
    
    connection = get_db_connection()
    if connection is None:
        return False
    
    cursor = connection.cursor()
    
    try:
        query = "UPDATE artworks SET image_url = %s WHERE id = %s"
        cursor.execute(query, (image_path, artwork_id))
        connection.commit()
        
        return True
    except Exception as e:
        print(f"Error updating artwork image: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
