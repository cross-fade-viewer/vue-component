import {
  ref, onMounted, defineComponent, computed, WritableComputedRef,
} from 'vue';
import OpenSeadragon from 'openseadragon';
import draggable from 'vuedraggable';
import {
  ImageCollection, Image, removeImageFromOneCollectionAndAddToAnother, Theme,
} from '@cross-fade-viewer/core';
import LayerControl from '../LayerControl.vue';
import ImagePreview from '../ImagePreview.vue';
import CrossFadeGallery from '../cross-fade-gallery/CrossFadeGallery.vue';
import BaseIcon from '../BaseIcon.vue';
import ArrowIcon from '../icons/ArrowIcon.vue';
import CloseIcon from '../icons/CloseIcon.vue';
import OpacityHighIcon from '../icons/OpacityHighIcon.vue';
import OpacityLowIcon from '../icons/OpacityLowIcon.vue';

interface Data {
  // TODO: Remove warning
  [key: string]: any
}

export default defineComponent({
  name: 'CrossFadeViewer',
  components: {
    LayerControl,
    draggable,
    ImagePreview,
    CrossFadeGallery,
    // icons:
    BaseIcon,
    ArrowIcon,
    CloseIcon,
    OpacityHighIcon,
    OpacityLowIcon,
  },
  props: {
    availableImages: { type: Array, default: () => [] },
    displayedImages: { type: Array, default: () => [] },
    integratedGallery: { type: Boolean, default: true },
    noImageText: {
      type: String,
      default: 'There are no images to be displayed.',
    },
    themeName: { type: String, default: Theme.base },
  },
  setup(props: Data) {
    let viewer : OpenSeadragon.Viewer;

    const showGallery = ref<boolean>(false);
    const isControlMenuMinimized = ref<boolean>(false);
    const selectedLayerIndex = ref<number|undefined>();
    const displayedOpacity = ref<number>(1);
    const unusedImages = ref<ImageCollection>(props.availableImages);
    const usedImages = ref<ImageCollection>(props.displayedImages);
    const usedTheme = ref<Theme>(props.themeName);

    const usedImagesReverse: WritableComputedRef<ImageCollection> = computed({
      get(): ImageCollection {
        return usedImages.value.slice().reverse();
      },
      set(newCollection: ImageCollection): void {
        usedImages.value = newCollection.slice().reverse();
      },
    });

    function selectLayer(index: number | undefined) {
      selectedLayerIndex.value = index;
      if (index !== undefined) {
        displayedOpacity.value = usedImages.value[index ?? 0].opacity;
      }
    }

    function useImage(index: number) {
      const result = removeImageFromOneCollectionAndAddToAnother(
        index,
        unusedImages.value,
        usedImages.value,
      );
      unusedImages.value = result.removedFromCollection;
      usedImages.value = result.addedToCollection;
      selectLayer(usedImages.value.length - 1);
      viewer.addSimpleImage({ url: usedImages.value[usedImages.value.length - 1].sourceUrl });
    }

    function onUseImage(index: number) {
      useImage(index);
    }

    function reverseIndexOfArray(index: number, array: Array<any>): number {
      return array.length - 1 - index;
    }

    function onLayerMoved(event: any) {
      selectLayer(reverseIndexOfArray(event.moved.newIndex, usedImages.value));
      const oldIndex = reverseIndexOfArray(event.moved.oldIndex, usedImages.value);
      const newIndex = reverseIndexOfArray(event.moved.newIndex, usedImages.value);

      const movedImage = viewer.world.getItemAt(oldIndex);
      viewer.world.setItemIndex(movedImage, newIndex);
    }

    function sliderChanged(event: any) {
      const opacity = event.srcElement.value;
      const index = selectedLayerIndex.value || 0;
      usedImages.value[index].opacity = opacity;
      viewer.world.getItemAt(index).setOpacity(opacity);
    }

    function removeImage(index: number) {
      // TODO: Select proper index
      if (selectedLayerIndex.value === index || index < (selectedLayerIndex.value || 0)) {
        selectedLayerIndex.value = usedImages.value.length - 1 > 0
          ? usedImages.value.length - 2
          : undefined;
      }

      const result = removeImageFromOneCollectionAndAddToAnother(
        index,
        usedImages.value,
        unusedImages.value,
      );
      unusedImages.value = result.addedToCollection;
      usedImages.value = result.removedFromCollection;
      viewer.world.removeItem(viewer.world.getItemAt(index));
    }

    function replaceThemeClass(themeName: Theme) {
      const element = document.getElementById('cf-viewer-base');

      if (themeName === Theme.base) {
        return;
      }
      element?.classList.remove('base');
      element?.classList.add(themeName);
    }

    onMounted(() => {
      replaceThemeClass(usedTheme.value);

      viewer = OpenSeadragon({
        // TODO: Might cause trouble when using our component multiple times.
        id: 'openseadragon',
        showNavigator: false,
        showNavigationControl: false,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        showFlipControl: false,
        showSequenceControl: false,
        showReferenceStrip: false,
      });

      usedImages.value.forEach((image: Image) => {
        viewer.addSimpleImage({ url: image.sourceUrl });
      });
    });

    return {
      unusedImages,
      usedImages,
      useImage,
      showGallery,
      onUseImage,
      sliderChanged,
      removeImage,
      selectedLayerIndex,
      selectLayer,
      displayedOpacity,
      onLayerMoved,
      usedImagesReverse,
      reverseIndexOfArray,
      isControlMenuMinimized,
    };
  },
});
