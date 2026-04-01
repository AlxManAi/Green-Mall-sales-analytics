/*
  ВЫПОЛНИТЕ ЭТОТ SQL В SUPABASE SQL EDITOR.
  Этот скрипт создает все 8 функций, необходимых для работы BI-системы,
  с поддержкой фильтров по городу, категории и датам.
*/

-- 1. Ключевые метрики (dashboard_kpis)
CREATE OR REPLACE FUNCTION dashboard_kpis(
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_sales BIGINT,
  unique_customers BIGINT,
  avg_check NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s."Quantity" * p."Price" * (1 - s."Discount")), 0)::NUMERIC as total_revenue,
    COUNT(DISTINCT s."SalesID")::BIGINT as total_sales,
    COUNT(DISTINCT s."CustomerID")::BIGINT as unique_customers,
    COALESCE(AVG(s."Quantity" * p."Price" * (1 - s."Discount")), 0)::NUMERIC as avg_check
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date);
END;
$$ LANGUAGE plpgsql;

-- 2. Выручка по месяцам (monthly_revenue)
CREATE OR REPLACE FUNCTION monthly_revenue(
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  month TEXT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(s."SalesDate", 'YYYY-MM') as month,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as revenue
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

-- 3. Выручка по категориям (revenue_by_category)
CREATE OR REPLACE FUNCTION revenue_by_category(
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_name TEXT,
  total_revenue NUMERIC,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cat."CategoryName" as category_name,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue,
    COUNT(s."SalesID")::BIGINT as sales_count
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Топ товаров (top_products)
CREATE OR REPLACE FUNCTION top_products(
  lim INT DEFAULT 10,
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_name TEXT,
  total_revenue NUMERIC,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p."ProductName" as product_name,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue,
    SUM(s."Quantity")::BIGINT as sales_count
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY total_revenue DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql;

-- 5. Топ городов (top_cities)
CREATE OR REPLACE FUNCTION top_cities(
  lim INT DEFAULT 10,
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  city_name TEXT,
  total_revenue NUMERIC,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci."CityName" as city_name,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue,
    COUNT(s."SalesID")::BIGINT as sales_count
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY total_revenue DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql;

-- 6. Топ продавцов (top_sellers)
CREATE OR REPLACE FUNCTION top_sellers(
  lim INT DEFAULT 10,
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  seller_name TEXT,
  total_revenue NUMERIC,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sel."SellerName" as seller_name,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue,
    COUNT(s."SalesID")::BIGINT as sales_count
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN sellers sel ON s."SellerID" = sel."SellerID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY total_revenue DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql;

-- 7. Анализ скидок (discount_analysis)
CREATE OR REPLACE FUNCTION discount_analysis(
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  discount_range TEXT,
  avg_discount NUMERIC,
  total_revenue NUMERIC,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s."Discount" = 0 THEN 'Без скидки'
      WHEN s."Discount" <= 0.1 THEN 'До 10%'
      WHEN s."Discount" <= 0.2 THEN '10-20%'
      ELSE 'Более 20%'
    END as discount_range,
    AVG(s."Discount")::NUMERIC as avg_discount,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue,
    COUNT(s."SalesID")::BIGINT as sales_count
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1
  ORDER BY avg_discount;
END;
$$ LANGUAGE plpgsql;

-- 8. Анализ пола и категорий (gender_category_analysis)
CREATE OR REPLACE FUNCTION gender_category_analysis(
  city_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_name TEXT,
  gender TEXT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cat."CategoryName" as category_name,
    sel."Gender" as gender,
    SUM(s."Quantity" * p."Price" * (1 - s."Discount"))::NUMERIC as total_revenue
  FROM sales s
  JOIN products p ON s."ProductID" = p."ProductID"
  JOIN categories cat ON p."CategoryID" = cat."CategoryID"
  JOIN sellers sel ON s."SellerID" = sel."SellerID"
  JOIN customers cust ON s."CustomerID" = cust."CustomerID"
  JOIN cities ci ON cust."CityID" = ci."CityID"
  WHERE (city_filter IS NULL OR ci."CityName" = city_filter)
    AND (category_filter IS NULL OR cat."CategoryName" = category_filter)
    AND (start_date IS NULL OR s."SalesDate" >= start_date)
    AND (end_date IS NULL OR s."SalesDate" <= end_date)
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$ LANGUAGE plpgsql;
