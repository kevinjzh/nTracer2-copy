class Constants:
    DEFAULT_SHADER = """
#uicontrol bool channel_1 checkbox(default=true)
#uicontrol bool channel_2 checkbox(default=true)
#uicontrol bool channel_3 checkbox(default=true)
#uicontrol bool channel_4 checkbox(default=true)

#uicontrol vec3 color_channel_1 color(default="red")
#uicontrol float brightness_channel_1 slider(min=-1, max=1, step=0.01)
#uicontrol float contrast_channel_1 slider(min=-10, max=10, step=0.01, default=4)
#uicontrol float gamma_channel_1 slider(min=-3, max=3, step=0.01, default=1)

#uicontrol vec3 color_channel_2 color(default="green")
#uicontrol float brightness_channel_2 slider(min=-1, max=1, step=0.01)
#uicontrol float contrast_channel_2 slider(min=-10, max=10, step=0.01, default=4)
#uicontrol float gamma_channel_2 slider(min=-3, max=3, step=0.01, default=1)

#uicontrol vec3 color_channel_3 color(default="blue")
#uicontrol float brightness_channel_3 slider(min=-1, max=1, step=0.01)
#uicontrol float contrast_channel_3 slider(min=-10, max=10, step=0.01, default=4)
#uicontrol float gamma_channel_3 slider(min=-3, max=3, step=0.01, default=1)

#uicontrol vec3 color_channel_4 color(default="blue")
#uicontrol float brightness_channel_4 slider(min=-1, max=1, step=0.01)
#uicontrol float contrast_channel_4 slider(min=-10, max=10, step=0.01, default=2)
#uicontrol float gamma_channel_4 slider(min=-3, max=3, step=0.01, default=1)

#uicontrol float gamma_global slider(min=-3, max=3, step=0.01, default=1)

void main() {
    vec3 val = vec3(0,0,0);
    vec3 toadd = vec3(0,0,0);

    if(channel_1) {
        toadd = color_channel_1 * (toNormalized(getDataValue(0))) * exp(contrast_channel_1);
        toadd += color_channel_1 * brightness_channel_1;
        toadd = pow(toadd, vec3(gamma_channel_1,gamma_channel_1,gamma_channel_1));
        val += toadd;
    }
    if(channel_2) {
        toadd = color_channel_2 * (toNormalized(getDataValue(1))) * exp(contrast_channel_2);
        toadd += color_channel_2 * brightness_channel_2;
        toadd = pow(toadd, vec3(gamma_channel_2,gamma_channel_2,gamma_channel_2));
        val += toadd;
    }
    if(channel_3) {
        toadd = color_channel_3 * (toNormalized(getDataValue(2))) * exp(contrast_channel_3);
        toadd += color_channel_3 * brightness_channel_3;
        toadd = pow(toadd, vec3(gamma_channel_3,gamma_channel_3,gamma_channel_3));
        val += toadd;
    }
    if(channel_4) {
        toadd = color_channel_4 * (toNormalized(getDataValue(3))) * exp(contrast_channel_4);
        toadd += color_channel_4 * brightness_channel_4;
        toadd = pow(toadd, vec3(gamma_channel_4,gamma_channel_4,gamma_channel_4));
        val += toadd;
    }

    val =  pow(val,vec3(gamma_global,gamma_global,gamma_global));
    
    emitRGB(val);
}
        """

    GRAYSCALE_SHADER = """
            void main() {
            float pt = toNormalized(getDataValue());
            float scale = 60.0;
            emitGrayscale(pt*scale);
            }
            """

    PROJECTION_SHADER = """
            void main() {
            vec3 pt = vec3(toNormalized(getDataValue(0)),
                    toNormalized(getDataValue(1)),
                    toNormalized(getDataValue(2)));
            vec3 scale = vec3( 10, 10, 10 );
            emitRGB(pt*scale);
            }
            """

    IS_DEBUG_MODE = True

    COLOR_CHANNEL = 1
