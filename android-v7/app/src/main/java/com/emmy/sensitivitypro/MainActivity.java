package com.emmy.sensitivitypro;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public class MainActivity extends Activity {

    private static final int PICK_FILE = 4101;
    private static final int SAVE_FILE = 4102;

    private ValueCallback<Uri[]> fileCallback;
    private String backupContent = "{}";
    private String backupName = "emmy-pro-v7-backup.json";

    private WebView webView;
    private WebViewAssetLoader loader;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);

        getWindow().setStatusBarColor(
            android.graphics.Color.rgb(9, 11, 24)
        );

        getWindow().setNavigationBarColor(
            android.graphics.Color.rgb(9, 11, 24)
        );

        loader = new WebViewAssetLoader.Builder()
            .addPathHandler(
                "/assets/",
                new WebViewAssetLoader.AssetsPathHandler(this)
            )
            .build();

        webView = new WebView(this);
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(true);

        webView.setBackgroundColor(
            android.graphics.Color.rgb(9, 11, 24)
        );

        webView.addJavascriptInterface(
            new AndroidBridge(),
            "AndroidBridge"
        );

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                WebView view,
                android.webkit.WebResourceRequest request
            ) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                WebView view,
                ValueCallback<Uri[]> callback,
                FileChooserParams params
            ) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }

                fileCallback = callback;

                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("application/json");

                startActivityForResult(
                    Intent.createChooser(pick, "Select backup file"),
                    PICK_FILE
                );

                return true;
            }
        });

        webView.loadUrl(
            "https://appassets.androidplatform.net/assets/index.html"
        );
    }

    private class AndroidBridge {

        @JavascriptInterface
        public void saveBackup(String filename, String content) {

            backupName = filename == null
                ? "emmy-pro-v7-backup.json"
                : filename;

            backupContent = content == null ? "{}" : content;

            runOnUiThread(() -> {
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                save.addCategory(Intent.CATEGORY_OPENABLE);
                save.setType("application/json");
                save.putExtra(Intent.EXTRA_TITLE, backupName);

                startActivityForResult(save, SAVE_FILE);
            });
        }
    }

    @Override
    protected void onActivityResult(
        int request,
        int result,
        Intent data
    ) {
        super.onActivityResult(request, result, data);

        if (request == PICK_FILE && fileCallback != null) {

            Uri[] uris = result == RESULT_OK
                && data != null
                && data.getData() != null
                ? new Uri[]{data.getData()}
                : null;

            fileCallback.onReceiveValue(uris);
            fileCallback = null;

        } else if (
            request == SAVE_FILE
            && result == RESULT_OK
            && data != null
            && data.getData() != null
        ) {

            try (
                OutputStream out = getContentResolver()
                    .openOutputStream(data.getData())
            ) {
                if (out != null) {
                    out.write(
                        backupContent.getBytes(StandardCharsets.UTF_8)
                    );

                    Toast.makeText(
                        this,
                        "Backup saved successfully",
                        Toast.LENGTH_LONG
                    ).show();
                }

            } catch (Exception e) {
                Toast.makeText(
                    this,
                    "Could not save backup",
                    Toast.LENGTH_LONG
                ).show();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
  }
