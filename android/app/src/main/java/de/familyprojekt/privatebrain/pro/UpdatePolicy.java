package de.familyprojekt.privatebrain.pro;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Fixed repository, separate installation channels, canonical numeric versions.
 *  Private Brain V3 Pro (Klaus 2026-10-24) asks only its own repository and only tags "v3-android-…", so a release of
 *  Private Brain Pro (lausiklauskn-png/Privat-Brain-Pro, tags "v1.0.0-preview.N") never reaches a V3 installation. */
final class UpdatePolicy {
    static final String REPOSITORY = "lausiklauskn-png/Privat-Brain-Pro-V3";
    static final String TAG_PREFIX = "v3-android-";
    static final String APK_PREFIX = "Private-Brain-V3-Pro-";
    private static final String NUMBER = "(0|[1-9][0-9]{0,8})";
    private static final Pattern TAG = Pattern.compile("^v" + NUMBER + "\\." + NUMBER + "\\." + NUMBER + "(?:-preview\\." + NUMBER + ")?$");

    static long[] version(String tag, boolean preview) {
        Matcher match = TAG.matcher(tag);
        if (!match.matches() || (match.group(4) != null) != preview) return null;
        return new long[] {Long.parseLong(match.group(1)), Long.parseLong(match.group(2)),
            Long.parseLong(match.group(3)), preview ? Long.parseLong(match.group(4)) : 0};
    }

    static boolean newer(String candidate, String installed, boolean preview) {
        long[] next = version(candidate, preview), current = version(installed, preview);
        if (next == null || current == null) return false;
        for (int i = 0; i < next.length; i++) {
            if (next[i] != current[i]) return next[i] > current[i];
        }
        return false;
    }

    /** "v3-android-3.0.0-preview.2" → "v3.0.0-preview.2"; any other tag (also Pro's) → null. */
    static String commonTag(String releaseTag) {
        if (releaseTag == null || !releaseTag.startsWith(TAG_PREFIX)) return null;
        return "v" + releaseTag.substring(TAG_PREFIX.length());
    }

    static String downloadUrl(String releaseTag, String filename, boolean preview) {
        String common = commonTag(releaseTag);
        if (common == null || version(common, preview) == null || !filename.equals(APK_PREFIX + common.substring(1) + ".apk")) {
            throw new IllegalArgumentException("Unsupported release asset");
        }
        return "https://github.com/" + REPOSITORY + "/releases/download/" + releaseTag + "/" + filename;
    }
}
