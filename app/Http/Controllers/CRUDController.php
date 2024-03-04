<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Licenses;
use Illuminate\Http\Request;

class CRUDController extends Controller
{
    public function index()
    {
        $licenses = Licenses::all();
        return view('licenses.index', compact('licenses'));
    }

    public function create()
    {
        $apps = App::all();
        return view('licenses.create', compact('apps'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'total' => 'required|integer',
            'used' => 'required|integer',
            'available' => 'required|integer',
            'app_type_id' => 'required|exists:apps,id',
        ]);

        Licenses::create([
            'total' => $request->input('total'),
            'used' => $request->input('used'),
            'available' => $request->input('available'),
            'app_type_id' => $request->input('app_type_id'),
        ]);

        return redirect()->route('licenses.index')->with('success', 'License created successfully');
    }

    public function show($id)
    {
        $license = Licenses::findOrFail($id);
        return view('licenses.show', compact('license'));
    }

    public function edit($id)
    {
        $license = Licenses::findOrFail($id);
        $apps = App::all();
        return view('licenses.edit', compact('license', 'apps'));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'total' => 'required|integer',
            'used' => 'required|integer',
            'available' => 'required|integer',
            'app_type_id' => 'required|exists:apps,id',
        ]);

        $license = Licenses::findOrFail($id);

        $license->update([
            'total' => $request->input('total'),
            'used' => $request->input('used'),
            'available' => $request->input('available'),
            'app_type_id' => $request->input('app_type_id'),
        ]);

        return redirect()->route('licenses.index')->with('success', 'License updated successfully');
    }

    public function destroy($id)
    {
        $license = Licenses::findOrFail($id);
        $license->delete();

        return redirect()->route('licenses.index')->with('success', 'License deleted successfully');
    }
}
