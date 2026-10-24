package de.familyprojekt.privatebrain.pro;

import org.junit.Test;
import static org.junit.Assert.*;

public class UpdatePolicyTest {
    @Test public void numericVersionOrderingPreventsDowngrades() {
        assertTrue(UpdatePolicy.newer("v0.1.0-preview.10", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v0.2.0-preview.1", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v1.10.0", "v1.9.9", false));
    }

    @Test public void previewAndStableAreSeparateInstallations() {
        assertFalse(UpdatePolicy.newer("v9.0.0", "v0.1.0-preview.2", true));
        assertFalse(UpdatePolicy.newer("v9.0.0-preview.2", "v1.0.0", false));
        assertNull(UpdatePolicy.version("v1.0.0-beta.1", true));
        assertNull(UpdatePolicy.version("v01.0.0", false));
        assertNull(UpdatePolicy.version("v999999999999999999999.0.0", false));
    }

    @Test public void onlyV3ApksFromTheV3RepositoryCanOpen() {
        String tag = "v3-android-3.0.0-preview.2";
        String expected = "https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/" + tag + "/";
        assertEquals("v3.0.0-preview.2", UpdatePolicy.commonTag(tag));
        assertEquals(expected + "Private-Brain-V3-Pro-3.0.0-preview.2.apk", UpdatePolicy.downloadUrl(tag, "Private-Brain-V3-Pro-3.0.0-preview.2.apk", true));
        for (String name : new String[] {"../Private-Brain-V3-Pro-3.0.0-preview.2.apk", "https://example.com/app.apk", "other.apk",
                "Private-Brain-V3-Pro-3.0.0-preview.1.apk", "Private-Brain-Pro-3.0.0-preview.2.apk", "Private-Brain-Pro.apk"}) {
            try {
                UpdatePolicy.downloadUrl(tag, name, true);
                fail("Unexpected file accepted: " + name);
            } catch (IllegalArgumentException expectedError) { }
        }
    }

    @Test public void privateBrainProReleasesNeverReachV3() {
        assertNotEquals("lausiklauskn-png/Privat-Brain-Pro", UpdatePolicy.REPOSITORY);
        for (String tag : new String[] {"v1.0.0-preview.29", "v9.0.0-preview.1", "windows-v1.0.0-preview.29", "v3-windows-3.0.0-preview.2"}) {
            assertNull(UpdatePolicy.commonTag(tag));
            try {
                UpdatePolicy.downloadUrl(tag, "Private-Brain-Pro-" + tag.substring(tag.indexOf('v') + 1) + ".apk", true);
                fail("Foreign release accepted: " + tag);
            } catch (IllegalArgumentException expectedError) { }
        }
    }
}
