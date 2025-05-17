
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
