package com.google.common.geometry.experiment;

import com.google.common.geometry.*;
import com.sun.deploy.util.StringUtils;

import java.io.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by rados on 12/12/2017.
 */
public class Experiment {

    private static final Logger log = Logger.getLogger(S2PolygonBuilder.class.getCanonicalName());

    /*
    private double calculateArea(List<double[]> geofence_normal){
        //calculate area for irregular polygon
        List<double[]> geofence = geofence_normal.revers();

        List<double[]> polygon = [];
        for (var t = 0; t < geofence.size(); t++) {

            polygon.add({lng: geofence[t][1], lat: geofence[t][0]});
        }
        return geoarea(polygon) / 1000000;
    }*/

    private static double[] getNewPointFromDistanceBearing(double[] a, double distance, double bearing) {

        double lat = a[0];
        double lon = a[1];
        double dist = distance / 6371;
        double brng = deg2rad(bearing);

        double lat1 = deg2rad(lat);
        double lon1 = deg2rad(lon);

        double lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
                Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

        double lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
                        Math.cos(lat1),
                Math.cos(dist) - Math.sin(lat1) *
                        Math.sin(lat2));

        return new double[]{rad2deg(lat2), rad2deg(lon2)};
    }

    private static double deg2rad(double deg) {
        return deg * (Math.PI/180);
    }

    private static double rad2deg(double rad) {
        return rad * 180 / Math.PI;
    }


    private static List<double[]> generateRandomGeofence(){

        double maxBearing = 45;

        double[] center = {52.520007, 13.404954};

        List<double[]> geofence = new ArrayList<>();
        double bearing = 0;

        while(bearing < 360 - maxBearing){
            double newBearing = Math.floor(Math.random() * maxBearing) + bearing;
            while(newBearing > 360) {
                newBearing = Math.floor(Math.random() * maxBearing) + bearing;
            }
            double distance = Math.floor(Math.random() * 10) + 10;
            geofence.add(0, getNewPointFromDistanceBearing(center, distance, newBearing));
            bearing = newBearing;
        }
        return geofence;
    }

    private static long removeZeros(long id){
        String binary = Long.toBinaryString(id);
        int x;
        for(x = binary.toCharArray().length - 1; x > -1; x--){
            if(binary.charAt(x) != '0'){
                break;
            }
        }
        return id >> (x - 1);
    }

    static String fenceToString(List<double[]> numbers) {
        StringBuilder builder = new StringBuilder();
        // Append all Integers in StringBuilder to the StringBuilder.
        for (double[] number : numbers) {
            builder.append(number[0]);
            builder.append(",");
            builder.append(number[1]);
            builder.append(",");
        }
        // Remove last delimiter with setLength.
        builder.setLength(builder.length() - 1);
        return builder.toString();
    }

    static String convertToString(List<Long> numbers) {
        StringBuilder builder = new StringBuilder();
        // Append all Integers in StringBuilder to the StringBuilder.
        for (long number : numbers) {
            builder.append(number);
            builder.append(",");
        }
        // Remove last delimiter with setLength.
        builder.setLength(builder.length() - 1);
        return builder.toString();
    }


    private static Object[] findCover(List<double[]> fence, int maxCells) throws IOException {

        Map<Integer, Integer> cellDistribution = new HashMap<Integer, Integer>();
        long bitsCount = 0;
        int cellCount = 0;

        List<S2Point> points = new ArrayList<>();

        for(double[] point : fence){
            points.add(0, S2LatLng.fromDegrees(point[0], point[1]).toPoint());
            //points.add(S2LatLng.fromDegrees(point[0], point[1]).toPoint());
        }

        S2Loop loop = new S2Loop(points);
        loop.normalize();
        S2Polygon region = new S2Polygon(loop);

        S2RegionCoverer coverer = new S2RegionCoverer();
        coverer.setMinLevel(0);
        coverer.setMaxLevel(30);
        coverer.setMaxCells(maxCells);
        S2CellUnion union = coverer.getCovering(region);


        //BufferedWriter writer_fences_points = new BufferedWriter(new FileWriter( "fences_points.txt", true));
        //BufferedWriter write_fences_info = new BufferedWriter(new FileWriter( "fences_info_s2_" + maxLevel + ".txt", true));

        List<Long> ids = new ArrayList<Long>();
        String fence_points = "";
        cellCount = union.size();

        for(S2CellId id : union.cellIds()){
            S2Cell s2Cell = new S2Cell(id);
            ids.add(removeZeros(id.id()));

            int lvl = id.level();
            bitsCount += (4 + 2*lvl);

            if(cellDistribution.containsKey(lvl)) cellDistribution.put(lvl, cellDistribution.get(lvl)+1);
                else cellDistribution.put(lvl, 1);

            for(int j = 0; j < 4; j++){
                S2Point p = s2Cell.getVertex(j);
                fence_points = fence_points.concat(p.toDegreesString() + ",");
            }
        }

        Double areaCovered = union.exactArea() * 6377.083 * 6377.083;
        //log.info(String.valueOf(areaCovered));

        /*writer_fences_points.write(fence_points);
        writer_fences_points.newLine();
        writer_fences_points.close();

        write_fences_info.write(cellCount + ", " + areaCovered + ", " + bitsCount);
        write_fences_info.newLine();
        write_fences_info.close();*/

        return new Object[]{union.size(), areaCovered, cellDistribution};
    }

    private static ArrayList<Double> readRealArea() throws IOException {
        BufferedReader br = new BufferedReader(new FileReader("f_info.txt"));
        String line;
        ArrayList<Double> realArea = new ArrayList<>();

        while ((line = br.readLine()) != null) {
            realArea.add(Double.valueOf(line));
        }
        return realArea;
    }

    private static void readFromFile(String path) throws IOException {

        ArrayList<Double> realArea = readRealArea();
        for(int i = 100; i <=2000; i += 100) {

            double meanArea = 0.0;
            double meanCells = 0.0;
            Map<Integer, Double> cellDistribution = new HashMap<Integer, Double>();
            int count = 0;

            BufferedReader br = new BufferedReader(new FileReader(path));
            String line;

            while ((line = br.readLine()) != null) {
                List<double[]> fence = new ArrayList<>();
                line = line.replaceAll("\\(", "").replaceAll("\\)", "");
                String[] cords = line.split(",");
                for (int j = 0; j < cords.length; j += 2) {
                    fence.add(new double[]{Double.valueOf(cords[j + 1]), Double.valueOf(cords[j])});
                }
                Object[] info = findCover(fence, i);
                meanArea += (((Double) info[1] / realArea.get(count)) * 100.0);
                meanCells += Double.valueOf((int)info[0]);
                Map<Integer, Integer> current = ((Map<Integer, Integer>) info[2]);
                for( Integer key : current.keySet()){
                    if(cellDistribution.containsKey(key)) cellDistribution.put(key, cellDistribution.get(key)+current.get(key));
                    else cellDistribution.put(key, Double.valueOf(current.get(key)));
                }

                count++;

            }

            for(Integer key : cellDistribution.keySet()) cellDistribution.put(key, cellDistribution.get(key) / count);

            log.info(String.valueOf(meanArea));
            BufferedWriter write_fences_info = new BufferedWriter(new FileWriter( "fences_info.txt", true));
            write_fences_info.write(meanCells / count + ", " + meanArea / count);
            write_fences_info.newLine();
            write_fences_info.close();

            BufferedWriter write_cell_distribution = new BufferedWriter(new FileWriter( "cell_distribution.txt", true));
            write_cell_distribution.write(cellDistribution.toString());
            write_cell_distribution.newLine();
            write_cell_distribution.close();
        }
    }

    public static void main(String[] args) throws IOException {

        readFromFile("fences.txt");
        //infoForOneFence();
    }
}
