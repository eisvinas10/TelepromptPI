@extends('frontend.layouts.app')

@section('title', app_name() . ' | ' . __('navs.general.home'))

@push('after-styles')
    {{style('//cdn.datatables.net/1.10.20/css/jquery.dataTables.min.css')}}
    <style>
        #reloadButton{
            position: fixed;
            top: 25px;
            left: 25px;
        }
        
        #ipaddress{
            position: fixed;
            bottom: 25px;
            left: 25px;
            z-index: 3;
        }
    </style>
@endpush

@push('after-scripts')
    {{script('//cdn.datatables.net/1.10.20/js/jquery.dataTables.min.js')}}
    <script>
        $(document).ready(function () {
            $('#transcripts').DataTable();
        });

        $('#reloadButton').on('click', function () {
            location.reload();
        });

        // ── Drag-and-drop upload zone ──────────────────────────────────────
        (function () {
            var zone      = document.getElementById('dropZone');
            var fileInput = zone ? zone.querySelector('.drop-zone__input') : null;
            var fileName  = document.getElementById('fileName');
            var dropPrompt = document.getElementById('dropPrompt');

            if (!zone || !fileInput) return;

            zone.addEventListener('dragover', function (e) {
                e.preventDefault();
                zone.classList.add('drop-zone--active');
            });

            ['dragleave', 'dragend'].forEach(function (type) {
                zone.addEventListener(type, function () {
                    zone.classList.remove('drop-zone--active');
                });
            });

            zone.addEventListener('drop', function (e) {
                e.preventDefault();
                zone.classList.remove('drop-zone--active');
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    showFileName(e.dataTransfer.files[0].name);
                }
            });

            fileInput.addEventListener('change', function () {
                if (fileInput.files.length) {
                    showFileName(fileInput.files[0].name);
                }
            });

            function showFileName(name) {
                dropPrompt.style.display = 'none';
                zone.querySelector('.drop-zone__icon').innerHTML = '<i class="fas fa-check-circle"></i>';
                fileName.textContent = name;
                fileName.style.display = 'block';
                zone.classList.add('has-file');
            }
        })();
    </script>
@endpush

@section('content')
    <button class="btn btn-primary" id="reloadButton">Reload</button>
    <button class="btn btn-dark" id="ipaddress" disabled>{{$ip}}</button>
    <div class="row m-5">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    Transcripts
                </div>
                <div class="card-body">
                    <table id="transcripts" class="display" style="width:100%">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        @foreach($transcripts as $transcript)
                            <tr>
                                <td>{{$transcript->title}}</td>
                                <td class="text-center">
                                    <div class="btn-group" role="group" aria-label="Basic example">
                                        <a href="{{route('frontend.transcript', $transcript)}}">
                                            <button type="button" class="btn btn-success">Play</button>
                                        </a>
                                        <a href="{{route('frontend.transcript.delete', $transcript)}}">
                                            <button type="button" class="btn btn-danger">Delete</button>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-12 text-center m-auto">
            <h1>OR</h1>
        </div>
        <div class="col-12">
            <div class="card upload-card">
                <div class="card-body p-4">
                    <h5 class="upload-title mb-4">
                        <i class="fas fa-upload"></i> Upload Transcript
                    </h5>
                    <form method="POST" action="{{route('frontend.upload')}}" enctype="multipart/form-data" id="uploadForm">
                        @csrf

                        <div class="form-group mb-4">
                            <label class="font-weight-bold mb-1" for="script_name">Script Name</label>
                            <input class="form-control form-control-modern"
                                   type="text"
                                   name="title"
                                   id="script_name"
                                   placeholder="Enter your script name…"
                                   required>
                        </div>

                        <div class="form-group mb-4">
                            <label class="font-weight-bold mb-1">Transcript File</label>
                            <div class="drop-zone" id="dropZone">
                                <div class="drop-zone__icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <p class="drop-zone__prompt" id="dropPrompt">
                                    Drag &amp; drop your file here<br>
                                    <span class="drop-zone__sub">or click to browse</span>
                                </p>
                                <p class="drop-zone__file-name" id="fileName" style="display:none;"></p>
                                <input type="file" class="drop-zone__input" id="inputGroupFile01" name="transcript" required>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-upload w-100" id="uploadBtn">
                            <i class="fas fa-cloud-upload-alt"></i> Upload Transcript
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
