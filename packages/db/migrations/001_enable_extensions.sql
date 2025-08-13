-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_product_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();
