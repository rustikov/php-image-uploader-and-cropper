const app = new Vue({
  el: '#app',
  data: {
    isLoading: false,
    items: [],
    editIndex: null,
    cropper: null,
    sortable: null,
  },
  watch: {
    items(to, from) {
      // console.log('images', to, from)
      if (this.items.filter(item => item.file !== null).length === this.items.filter(item => item.src !== null).length) {
        this.isLoading = false;
        if (this.sortable) {
          this.sortable.destroy();
        }
        this.sortable = Sortable.create(
          document.querySelector('.images'),
          {
            handle: ".thumb-icon-move",
            onSort: (e) => {
              let item = this.items[e.oldIndex];
              this.items[e.oldIndex] = this.items[e.newIndex];
              this.items[e.newIndex] = item;
            }
          }
        );
      }
    },
  },
  computed: {
    allImages() {
      return this.items.filter(item => {
        return true;
      }).map(item => {
        return item.src;
      })
    },
    editingImageSource() {
      return this.allImages.slice(this.editIndex, this.editIndex + 1).shift();
    },
  },
  methods: {
    makeItem() {
      return {
        src: null,
        file: null,
        transformations: null,
        style: '',
      }
    },
    loadMultiFiles(e) {
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      let item;
      for (let i = 0, ii = e.target.files.length; i < ii; i++) {
        item = this.makeItem();
        item.file = e.target.files[i];
        this.items.push(item);
        this.loadFile(item.file, i, (src, index) => {
          this.items[index].src = src;
          this.items = this.items.slice();
        })
      }
    },
    loadFile(file, index, callback) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        return callback(reader.result, index)
      }, false);
      reader.readAsDataURL(file);
    },
    removeFile(i) {
      if (this.isLoading) {
        return
      }
      if (window.confirm("Are you sure you would like to remove this image?")) {
        this.items.splice(i, 1);
      }
    },
    editFile(i) {
      if (this.isLoading) {
        return
      }
      this.editIndex = i;
      this.$nextTick(() => {
        let image = document.querySelector('#image');
        if (!this.cropper) {
          image.src = this.editingImageSource;
          this.cropper = new Cropper(image, {
            aspectRatio: 16/9,
            autoCrop: true,
            minCropBoxWidth: 100,
            scalable: false,
            movable: true,
            zoomOnWheel: false,
            highlight: false,
            preview: document.querySelector('.preview')
          });
        } else {
          image.addEventListener('ready', () => {
            let item = this.items[this.editIndex];
            if (item.transformations) {
              this.cropper.setData(item.transformations);
            }
          });
          this.cropper.replace(this.editingImageSource);
        }
      });
    },
    saveFiles(e) {
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      console.log('saving...')
      let formData = new FormData();
      for(let i = 0; i < this.items.length; i++){
        formData.append('files[' + i + ']', this.items[i].file);
        formData.append('transformations[' + i + ']', this.transformationToString(this.items[i].transformations));
      }
      axios.post( 'upload.php', formData, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      })
      .then(result => {
        console.log('SUCCESS!!');
        this.isLoading = false;
      })
      .catch(result => {
        this.isLoading = false;
        console.log('FAILURE!!');
      });
    },
    transformationToString(transformationData) {
      if (!transformationData) {
        return null;
      }
      return 'x:' + transformationData.x + ';y:' + transformationData.y + ';w:' + transformationData.width + ';h:' + transformationData.height + ';a:' + transformationData.rotate;
    },
    crop(i) {
      this.cropper.crop();
      this.items[this.editIndex].transformations = this.cropper.getData(true);
      this.items[this.editIndex].style = document.querySelector('.preview img').getAttribute('style');
      this.items = this.items.slice();
    },
    reset(e) {
      console.log('reset')
      this.cropper.reset();
    },
    exit(e) {
      this.editIndex = null;
    },
    zoomIn(e) {
      this.cropper.zoom(0.1);
    },
    zoomOut(e) {
      this.cropper.zoom(-0.1);
    },
    rotateLeft(e) {
        this.cropper.rotate(-15);
    },
    rotateRight(e) {
      this.cropper.rotate(15);
    }
  },
  mounted() {

  }
});
