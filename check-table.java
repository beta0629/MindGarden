import java.sql.*;

public class CheckTable {
    public static void main(String[] args) {
        String url = "jdbc:mysql://beta0629.cafe24.com:3306/core_solution?useSSL=false";
        String user = "mindgarden_dev";
        String password = "MindGardenDev2025!@#";
        
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getColumns(null, null, "onboarding_request", "id");
            
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                String columnType = rs.getString("TYPE_NAME");
                int dataType = rs.getInt("DATA_TYPE");
                int columnSize = rs.getInt("COLUMN_SIZE");
                
                System.out.println("Column: " + columnName);
                System.out.println("Type: " + columnType);
                System.out.println("SQL Type: " + dataType);
                System.out.println("Size: " + columnSize);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

