package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.*;

/** Separate Windows channel of Private Brain V3 Pro. A checked download opens only in the browser.
 *  V3 has its own repository and tag series, so Pro's Windows releases never reach a V3 install. */
final class DesktopUpdates {
    static final String REPOSITORY="lausiklauskn-png/Privat-Brain-Pro-V3";
    static final String TAG_PREFIX="v3-windows-";
    static final String INSTALLER_PREFIX="Private-Brain-V3-Pro-Windows-";
    private final AtomicBoolean checking=new AtomicBoolean();
    private volatile String download;
    interface Fetch { JSONArray releases()throws Exception; }
    private final Fetch fetch;
    DesktopUpdates(){this(DesktopUpdates::fetch);}
    DesktopUpdates(Fetch fetch){this.fetch=fetch;}
    JSONObject check()throws Exception {
        if(!checking.compareAndSet(false,true))throw new IOException("UPDATE_BUSY");
        download=null;
        try{
            AppNetwork.check();JSONObject result=select(fetch.releases(),DesktopBuild.VERSION);
            download=result.optString("url",null);result.remove("url");return result;
        }catch(AppNetwork.Blocked error){throw error;}
        catch(Exception error){throw new IOException("UPDATE_UNAVAILABLE");}
        finally{checking.set(false);}
    }
    String download()throws IOException {String value=download;if(value==null)throw new IOException("UPDATE_NOT_CHECKED");return value;}
    static JSONObject select(JSONArray releases,String installed){
        boolean preview=installed.contains("-preview.");String best="v"+installed,url=null;
        for(int i=0;i<releases.length();i++){
            JSONObject release=releases.optJSONObject(i);if(release==null||release.optBoolean("draft",true)||!release.has("prerelease")||release.optBoolean("prerelease")!=preview)continue;
            String tag=release.optString("tag_name");if(!tag.startsWith(TAG_PREFIX))continue;
            String common="v"+tag.substring(TAG_PREFIX.length());if(!UpdatePolicy.newer(common,best,preview))continue;
            JSONArray assets=release.optJSONArray("assets");if(assets==null)continue;
            String filename=INSTALLER_PREFIX+common.substring(1)+"-x64-setup.exe";
            String expected="https://github.com/"+REPOSITORY+"/releases/download/"+tag+"/"+filename;
            for(int j=0;j<assets.length();j++){
                JSONObject asset=assets.optJSONObject(j);if(asset==null)continue;
                if(filename.equals(asset.optString("name"))&&expected.equals(asset.optString("browser_download_url"))&&"uploaded".equals(asset.optString("state"))&&asset.optLong("size")>0&&asset.optLong("size")<=1024L*1024*1024){best=common;url=expected;break;}
            }
        }
        JSONObject result=new JSONObject().put("status",url==null?"current":"available").put("version",best.substring(1));
        if(url!=null)result.put("url",url);return result;
    }
    private static JSONArray fetch()throws Exception {
        HttpURLConnection connection=(HttpURLConnection)URI.create("https://api.github.com/repos/"+REPOSITORY+"/releases?per_page=100").toURL().openConnection();
        AppNetwork.check();AutoCloseable cancellation=AppNetwork.track(connection::disconnect);
        connection.setConnectTimeout(8000);connection.setReadTimeout(8000);connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept","application/vnd.github+json");connection.setRequestProperty("X-GitHub-Api-Version","2022-11-28");connection.setRequestProperty("User-Agent","Private-Brain-V3-Windows");
        try{
            if(connection.getResponseCode()!=200)throw new IOException();
            try(InputStream input=connection.getInputStream();ByteArrayOutputStream body=new ByteArrayOutputStream()){
                byte[] block=new byte[8192];int length;long deadline=System.nanoTime()+20_000_000_000L;
                while((length=input.read(block))!=-1){AppNetwork.check();if(body.size()+length>2*1024*1024||System.nanoTime()>deadline)throw new IOException();body.write(block,0,length);}
                return new JSONArray(body.toString(StandardCharsets.UTF_8));
            }
        }finally{AppNetwork.release(cancellation);connection.disconnect();}
    }
}
